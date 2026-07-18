"""Ingest the curated creative knowledge base into Supabase (pgvector).

Upserts by primary key, so the script is idempotent and safe to re-run.

Ingested: MECHANISMS (with local MiniLM embeddings) and CAMPAIGNS (sourced
example evidence). Deliberately NOT ingested: the year-stamped trends block
(current trends come from live research, not this file), plus the rubric and
playbook blocks, which ship with the creative agent's prompt instead.

`results` and `results_confidence` are stored exactly as curated. Figures
and confidence annotations are never altered (CLAUDE.md rule 10).

Usage: python scripts/ingest_mechanisms.py [path-to-knowledge-base.json]
"""

import argparse
import json
import os
import sys
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any

DEFAULT_PATH = Path(__file__).resolve().parents[1] / "data" / "vantage-creative-knowledge-base.json"

# coca_cola_recycle_logo is a known leftover duplicate of coca_cola_recycle_me
# (its own `why` field says so), so never ingest it.
SKIP_CAMPAIGN_IDS = frozenset({"coca_cola_recycle_logo"})

EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # 384-dim, free, runs locally

Encoder = Callable[[list[str]], Sequence[Sequence[float]]]
Upserter = Callable[[str, list[dict[str, Any]]], None]


def embedding_text(mechanism: dict[str, Any]) -> str:
    if mechanism.get("embedding_text"):
        return str(mechanism["embedding_text"])
    return f"{mechanism['name']}. {mechanism['definition']} {mechanism.get('why_it_works', '')}"


def mechanism_row(mechanism: dict[str, Any], embedding: Sequence[float]) -> dict[str, Any]:
    return {
        "id": mechanism["id"],
        "name": mechanism["name"],
        "definition": mechanism["definition"],
        "why_it_works": mechanism.get("why_it_works"),
        "best_for_business": mechanism.get("best_for_business"),
        "best_for_goals": mechanism.get("best_for_goals"),
        "budget_level": mechanism.get("budget_level"),
        # map the file's year-stamped field into the generic column
        "format_note": mechanism.get("format_note") or mechanism.get("format_2026"),
        "small_biz_example": mechanism.get("small_biz_example"),
        "examples": mechanism.get("examples"),
        "risk_note": mechanism.get("risk_note"),
        "embedding": str(list(embedding)),  # pgvector accepts "[0.1, 0.2, ...]"
    }


def campaign_row(campaign: dict[str, Any]) -> dict[str, Any]:
    # results / results_confidence are copied verbatim, never rounded,
    # reworded, or upgraded. The confidence annotations (including CONTESTED
    # notes) are the whole point of the curation (rule 10).
    return {
        "id": campaign["id"],
        "brand": campaign["brand"],
        "year": campaign["year"],
        "one_line": campaign["one_line"],
        "mechanism": campaign["mechanism"],
        "why": campaign["why"],
        "results": campaign["results"],
        "results_confidence": campaign["results_confidence"],
        "source": campaign["source"],
        "agency": campaign["agency"],
    }


def ingest(data: dict[str, Any], encode: Encoder, upsert: Upserter) -> dict[str, Any]:
    """Upsert mechanisms, then campaigns (campaigns FK-reference mechanisms)."""
    mechanisms = data["mechanisms"]
    embeddings = encode([embedding_text(m) for m in mechanisms])
    upsert(
        "creative_mechanisms",
        [mechanism_row(m, e) for m, e in zip(mechanisms, embeddings, strict=True)],
    )

    known_mechanisms = {m["id"] for m in mechanisms}
    rows: list[dict[str, Any]] = []
    skipped_duplicate: list[str] = []
    skipped_unknown: list[str] = []
    for campaign in data["campaigns"]:
        if campaign["id"] in SKIP_CAMPAIGN_IDS:
            skipped_duplicate.append(campaign["id"])
        elif campaign["mechanism"] not in known_mechanisms:
            # would violate the FK, so skip loudly instead of failing the batch
            skipped_unknown.append(campaign["id"])
        else:
            rows.append(campaign_row(campaign))
    upsert("creative_campaigns", rows)

    return {
        "mechanisms": len(mechanisms),
        "campaigns": len(rows),
        "skipped_duplicate": skipped_duplicate,
        "skipped_unknown_mechanism": skipped_unknown,
        "needs_sourcing": [c["id"] for c in data["campaigns"] if c.get("needs_sourcing")],
    }


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Ingest the creative knowledge base into Supabase (idempotent)."
    )
    parser.add_argument(
        "path",
        nargs="?",
        type=Path,
        default=DEFAULT_PATH,
        help=f"knowledge-base JSON (default: {DEFAULT_PATH})",
    )
    args = parser.parse_args(argv)
    data = json.loads(args.path.read_text(encoding="utf-8"))

    # Heavy/credentialed deps load lazily so importing this module is free.
    from postgrest.exceptions import APIError
    from sentence_transformers import SentenceTransformer
    from supabase import create_client

    model = SentenceTransformer(EMBEDDING_MODEL)
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    def encode(texts: list[str]) -> Sequence[Sequence[float]]:
        return [vector.tolist() for vector in model.encode(texts)]

    def upsert(table: str, rows: list[dict[str, Any]]) -> None:
        sb.table(table).upsert(rows).execute()

    try:
        summary = ingest(data, encode, upsert)
    except APIError as e:
        print(f"Supabase rejected the write: {e.message}", file=sys.stderr)
        if e.hint:
            print(f"hint from Postgres: {e.hint}", file=sys.stderr)
        print("Are backend/migrations applied, including 003 (grants)?", file=sys.stderr)
        return 1

    print(f"mechanisms upserted:         {summary['mechanisms']}")
    print(f"campaigns upserted:          {summary['campaigns']}")
    print(f"skipped duplicate campaign:  {summary['skipped_duplicate'] or '-'}")
    print(f"skipped unknown mechanism:   {summary['skipped_unknown_mechanism'] or '-'}")
    if summary["needs_sourcing"]:
        print(
            f"note: needs_sourcing flag on {summary['needs_sourcing']} — "
            "creative_campaigns has no column for it, so the flag is not stored"
        )
    print("trends block NOT ingested — current trends come from live research.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
