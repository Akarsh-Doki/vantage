"""Retrieval over the curated creative-mechanism library (pgvector).

retrieve_mechanisms() embeds the query with the same local model the ingest
script uses, gets a cosine-similarity candidate pool from Postgres (RPC
`match_creative_mechanisms`, migration 004), then re-ranks in Python with
boosts for matching business type, goal, and budget. On top of that there is a
deliberate small-business bias. Vantage's users are small and local, so a
mechanism a two-person shop can execute (zero/low budget, proven small-business
example) outranks one it can't, even at slightly lower raw similarity.

Each returned mechanism carries 1-2 example campaigns as sourced evidence
(their results/confidence text is the curated original, never altered).

Failures degrade to an empty list (rule 6). The creative node must treat
"no mechanisms" as a clear, handleable state, never a crash.
"""

import logging
import os
from functools import lru_cache
from typing import Any, cast

from supabase import Client, create_client

logger = logging.getLogger(__name__)

# Must match scripts/ingest_mechanisms.py. test_mechanisms.py pins the two.
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

_CANDIDATE_POOL = 20  # cosine candidates fetched before re-ranking
_EXAMPLES_PER_MECHANISM = 2

_W_BUSINESS = 0.15
_W_GOAL = 0.15
_W_BUDGET = 0.10
_W_SCRAPPY = 0.10  # executable on a zero/low budget
_W_SMALL_BIZ_EXAMPLE = 0.05  # proven at small-business scale

_SCRAPPY_BUDGETS = frozenset({"zero", "low"})

@lru_cache(maxsize=1)
def _client() -> Client:
    # Lazy so importing this module doesn't require env (matches the other tools).
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

@lru_cache(maxsize=1)
def _encoder() -> Any:
    from sentence_transformers import SentenceTransformer  # noqa: PLC0415 (heavy import)

    return SentenceTransformer(EMBEDDING_MODEL)

def _embed(text: str) -> list[float]:
    return [float(x) for x in _encoder().encode(text)]

def _lower(values: Any) -> set[str]:
    return {str(v).lower() for v in values or []}

def _score(mechanism: dict[str, Any], business_type: str, goal: str, budget: str) -> float:
    score = float(mechanism.get("similarity") or 0.0)

    if business_type.lower() in _lower(mechanism.get("best_for_business")):
        score += _W_BUSINESS

    if goal.lower() in _lower(mechanism.get("best_for_goals")):
        score += _W_GOAL

    budgets = _lower(mechanism.get("budget_level"))

    if budget.lower() in budgets:
        score += _W_BUDGET
    # The small/local-business bias. What a two-person shop can execute wins.

    if budgets & _SCRAPPY_BUDGETS:
        score += _W_SCRAPPY

    if mechanism.get("small_biz_example"):
        score += _W_SMALL_BIZ_EXAMPLE

    return score

def _pick_examples(campaigns: list[dict[str, Any]], mechanism_id: str) -> list[dict[str, Any]]:
    matching = [c for c in campaigns if c.get("mechanism") == mechanism_id]
    # Prefer campaigns whose curated confidence leads with "high", stable otherwise.
    matching.sort(key=lambda c: not str(c.get("results_confidence", "")).lower().startswith("high"))
    return matching[:_EXAMPLES_PER_MECHANISM]

def retrieve_mechanisms(
    query: str, business_type: str, goal: str, budget: str, k: int = 5
) -> list[dict[str, Any]]:
    """Top-k creative mechanisms for this brief, each with 1-2 example campaigns."""
    try:
        embedding = _embed(query)
        # The Supabase SDK types .data as generic JSON, but these rows are objects.
        candidates = cast(
            "list[dict[str, Any]]",
            _client()
            .rpc(
                "match_creative_mechanisms",
                {
                    "query_embedding": str(embedding),  # pgvector text literal
                    "match_count": max(_CANDIDATE_POOL, k),
                },
            )
            .execute()
            .data
            or [],
        )
        scored = sorted(
            ((_score(m, business_type, goal, budget), m) for m in candidates),
            key=lambda pair: (-pair[0], str(pair[1].get("id"))),
        )
        top = scored[: max(k, 0)]
        if not top:
            return []
        ids = [m["id"] for _, m in top]
        campaigns = cast(
            "list[dict[str, Any]]",
            _client().table("creative_campaigns").select("*").in_("mechanism", ids).execute().data
            or [],
        )
    except Exception:
        logger.exception("mechanism retrieval failed — returning no mechanisms")
        return []
    return [
        {**m, "score": score, "example_campaigns": _pick_examples(campaigns, m["id"])}
        for score, m in top
    ]
