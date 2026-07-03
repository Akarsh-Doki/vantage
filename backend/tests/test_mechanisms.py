"""Tests for app.tools.mechanisms — DB and embedder mocked (rule 9: $0 to run)."""

import logging
from typing import Any
from unittest.mock import MagicMock

import pytest

from app.tools import mechanisms
from scripts.ingest_mechanisms import EMBEDDING_MODEL as INGEST_EMBEDDING_MODEL


def _mech(
    mech_id: str,
    similarity: float,
    budgets: list[str],
    biz: list[str] | None = None,
    goals: list[str] | None = None,
    small_biz_example: str | None = None,
) -> dict[str, Any]:
    return {
        "id": mech_id,
        "name": mech_id,
        "definition": "def",
        "why_it_works": "why",
        "best_for_business": biz or [],
        "best_for_goals": goals or [],
        "budget_level": budgets,
        "format_note": "note",
        "small_biz_example": small_biz_example,
        "examples": [],
        "risk_note": None,
        "similarity": similarity,
    }


@pytest.fixture
def fake_db(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    """Fake Supabase client + embedder; set .rpc/.table return data per test."""
    client = MagicMock()
    client.rpc.return_value.execute.return_value.data = []
    client.table.return_value.select.return_value.in_.return_value.execute.return_value.data = []
    monkeypatch.setattr(mechanisms, "_client", lambda: client)
    monkeypatch.setattr(mechanisms, "_embed", lambda _text: [0.1, 0.2, 0.3])
    return client


def test_small_biz_bias_outranks_raw_similarity(fake_db: MagicMock) -> None:
    # A glossy big-budget mechanism is MORE similar, but the scrappy one is
    # executable by a two-person shop — the bias must put it first.
    fake_db.rpc.return_value.execute.return_value.data = [
        _mech("glossy_tv_spot", 0.90, budgets=["high"]),
        _mech("scrappy_stunt", 0.84, budgets=["zero", "low"], small_biz_example="a cafe did it"),
    ]

    out = mechanisms.retrieve_mechanisms("q", "restaurant", "awareness", "low", k=2)

    assert [m["id"] for m in out] == ["scrappy_stunt", "glossy_tv_spot"]
    assert out[0]["score"] > out[1]["score"]


def test_business_goal_and_budget_matches_boost_equal_similarity(fake_db: MagicMock) -> None:
    fake_db.rpc.return_value.execute.return_value.data = [
        _mech("generic", 0.5, budgets=["medium"]),
        _mech("on_target", 0.5, budgets=["medium"], biz=["restaurant"], goals=["foot_traffic"]),
    ]

    out = mechanisms.retrieve_mechanisms("q", "restaurant", "foot_traffic", "medium", k=2)

    assert [m["id"] for m in out] == ["on_target", "generic"]


def test_ranking_combines_filters_and_small_biz_favoring(fake_db: MagicMock) -> None:
    # Highest raw similarity: a big-brand mechanism. It must lose to BOTH the
    # filter-matched scrappy mechanism and the merely-scrappy one.
    fake_db.rpc.return_value.execute.return_value.data = [
        _mech("big_brand_glossy", 0.95, budgets=["high"]),
        _mech(
            "matching_scrappy",
            0.80,
            budgets=["zero", "low"],
            biz=["restaurant"],
            goals=["foot_traffic"],
            small_biz_example="chalkboard hack",
        ),
        _mech("unrelated_scrappy", 0.80, budgets=["low"]),
    ]

    out = mechanisms.retrieve_mechanisms("q", "restaurant", "foot_traffic", "low", k=3)

    assert [m["id"] for m in out] == [
        "matching_scrappy",  # matches business+goal+budget AND is small-biz doable
        "unrelated_scrappy",  # small-biz doable beats raw similarity alone
        "big_brand_glossy",
    ]


def test_joins_at_most_two_example_campaigns_preferring_high_confidence(
    fake_db: MagicMock,
) -> None:
    fake_db.rpc.return_value.execute.return_value.data = [
        _mech("mech_a", 0.9, budgets=["low"]),
        _mech("mech_b", 0.8, budgets=["low"]),
    ]
    fake_db.table.return_value.select.return_value.in_.return_value.execute.return_value.data = [
        {"id": "c1", "mechanism": "mech_a", "results_confidence": "medium (self-reported)"},
        {"id": "c2", "mechanism": "mech_a", "results_confidence": "high (award)"},
        {"id": "c3", "mechanism": "mech_a", "results_confidence": "low"},
    ]

    out = mechanisms.retrieve_mechanisms("q", "restaurant", "awareness", "low", k=2)

    examples_a = out[0]["example_campaigns"]
    assert len(examples_a) == 2
    assert examples_a[0]["id"] == "c2"  # "high (award)" first
    assert out[1]["example_campaigns"] == []  # mech_b has no campaigns


def test_k_and_candidate_pool_are_respected(fake_db: MagicMock) -> None:
    fake_db.rpc.return_value.execute.return_value.data = [
        _mech(f"m{i}", 0.9 - i * 0.01, budgets=["low"]) for i in range(10)
    ]

    out = mechanisms.retrieve_mechanisms("the query", "restaurant", "awareness", "low", k=3)

    assert len(out) == 3
    fake_db.rpc.assert_called_once_with(
        "match_creative_mechanisms",
        {"query_embedding": "[0.1, 0.2, 0.3]", "match_count": 20},
    )


def test_db_failure_degrades_to_empty_list(
    fake_db: MagicMock, caplog: pytest.LogCaptureFixture
) -> None:
    fake_db.rpc.side_effect = RuntimeError("db down")

    with caplog.at_level(logging.ERROR):
        assert mechanisms.retrieve_mechanisms("q", "restaurant", "awareness", "low") == []
    assert "mechanism retrieval failed" in caplog.text


def test_embedding_model_matches_ingest_script() -> None:
    # Retrieval must embed queries with the same model the library was
    # embedded with, or similarity scores are meaningless.
    assert mechanisms.EMBEDDING_MODEL == INGEST_EMBEDDING_MODEL
