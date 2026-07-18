"""Tests for the eval harness scoring. Pure functions, zero cost.

These verify the *measurement* logic (groundedness math, relevance parsing).
The eval harness itself spends money on a real run. Its offline path is
exercised via `python -m evals.run_eval --dry-run`, not here.
"""

from typing import Any

from evals.run_eval import (
    _cache_path,
    _estimated_cost_cents,
    _load_cached_research,
    _save_research_cache,
)
from evals.scoring import groundedness, parse_relevance_score

RESEARCH: list[dict[str, Any]] = [
    {"text": "finding a", "source_url": "https://a.example/x"},
    {"text": "finding b", "source_url": "https://b.example/y"},
    {"text": "no url", "source_url": ""},
]


def _concept(grounded_in: str) -> dict[str, Any]:
    return {"title": "c", "mechanism_id": "m", "grounded_in": grounded_in}


def test_groundedness_all_grounded() -> None:
    concepts = [_concept("https://a.example/x"), _concept("https://b.example/y")]
    assert groundedness(concepts, RESEARCH) == 1.0


def test_groundedness_partial() -> None:
    concepts = [
        _concept("https://a.example/x"),  # in research
        _concept("https://ghost.example/z"),  # NOT in research
    ]
    assert groundedness(concepts, RESEARCH) == 0.5


def test_groundedness_empty_source_never_counts() -> None:
    # A concept citing "" must not match a research finding that also has "".
    assert groundedness([_concept("")], RESEARCH) == 0.0


def test_groundedness_no_concepts_is_zero() -> None:
    assert groundedness([], RESEARCH) == 0.0


def test_groundedness_no_research_is_zero() -> None:
    assert groundedness([_concept("https://a.example/x")], []) == 0.0


def test_parse_relevance_prefers_explicit_score() -> None:
    assert parse_relevance_score("SCORE: 4\nAddresses the expectations well.") == 4
    # Even when other numbers appear first, the explicit score wins.
    assert parse_relevance_score("It meets 3 of 5 points. SCORE: 5") == 5


def test_parse_relevance_strips_code_fences_and_prose() -> None:
    # A fenced reply and one buried in prose both parse. The bug was these
    # failing and flooring to 1.
    assert parse_relevance_score("```\nSCORE: 4\n```") == 4
    assert (
        parse_relevance_score("This campaign is strongly grounded and on-strategy.\nSCORE: 5") == 5
    )
    assert parse_relevance_score("Relevance: 4/5 — well targeted.") == 4


def test_parse_relevance_falls_back_to_first_int() -> None:
    assert parse_relevance_score("I'd rate this a 3 out of 5.") == 3


def test_parse_relevance_clamps_to_1_5() -> None:
    assert parse_relevance_score("SCORE: 10") == 5
    assert parse_relevance_score("SCORE: 0") == 1


def test_parse_relevance_none_when_unparseable() -> None:
    # No 1-5 anywhere means None (unknown), NOT a silent floor of 1.
    assert parse_relevance_score("no numeric rating here") is None
    assert parse_relevance_score("") is None


def test_estimated_cost_is_mode_aware() -> None:
    # Sample ~3c/item, full ~30c/item. The confirmation number stays honest.
    assert _estimated_cost_cents(10, "sample") == 30
    assert _estimated_cost_cents(10, "full") == 450
    assert _estimated_cost_cents(4, "sample") < _estimated_cost_cents(4, "full")


def test_cache_path_slugifies_business_name() -> None:
    assert _cache_path("Rivertown Plumbing").name == "rivertown-plumbing.json"
    assert _cache_path("El Fuego Tacos!").name == "el-fuego-tacos.json"


def test_research_cache_round_trip(tmp_path: Any) -> None:
    path = tmp_path / "acme.json"
    assert _load_cached_research(path) is None  # nothing cached yet

    findings = [{"text": "a finding", "source_url": "https://a.example/x"}]
    _save_research_cache(path, "Acme Anvils", findings)

    assert _load_cached_research(path) == findings
