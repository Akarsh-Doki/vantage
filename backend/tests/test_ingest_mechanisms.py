"""Tests for scripts.ingest_mechanisms — DB and embedding model faked ($0 to run)."""

from typing import Any

from scripts.ingest_mechanisms import campaign_row, embedding_text, ingest, mechanism_row

KB: dict[str, Any] = {
    "_meta": {"version": "test"},
    "trends_2026": {"trend": "must never reach the database"},
    "rubric": {"also": "never ingested"},
    "mechanisms": [
        {
            "id": "mech_a",
            "name": "Mechanism A",
            "definition": "A definition.",
            "why_it_works": "Because.",
            "best_for_business": ["cafe"],
            "best_for_goals": ["awareness"],
            "budget_level": ["low"],
            "format_2026": "short vertical video",
            "small_biz_example": "example",
            "examples": ["e1"],
            "embedding_text": "embed me",
        },
    ],
    "campaigns": [
        {
            "id": "camp_ok",
            "brand": "BrandCo",
            "year": "2020",
            "one_line": "A campaign.",
            "mechanism": "mech_a",
            "why": "It fits.",
            "results": "Sales tripled per the brand.",
            "results_confidence": "medium (self-reported); high (award)",
            "source": "WARC 2020",
            "agency": "Agency X",
        },
        {
            "id": "coca_cola_recycle_logo",
            "brand": "Coca-Cola",
            "year": "2024",
            "one_line": "Duplicate reference.",
            "mechanism": "mech_a",
            "why": "Duplicate reference; see coca_cola_recycle_me.",
            "results": "Cannes 2024 Grand Prix.",
            "results_confidence": "high",
            "source": "Cannes Lions 2024",
            "agency": "Ogilvy",
        },
        {
            "id": "camp_orphan",
            "brand": "OrphanCo",
            "year": "2021",
            "one_line": "References a mechanism that does not exist.",
            "mechanism": "missing_mech",
            "why": "n/a",
            "results": "n/a",
            "results_confidence": "low (needs primary sourcing)",
            "source": "n/a",
            "agency": "n/a",
            "needs_sourcing": True,
        },
    ],
}


def _run(data: dict[str, Any]) -> tuple[dict[str, list[dict[str, Any]]], dict[str, Any]]:
    upserted: dict[str, list[dict[str, Any]]] = {}

    def encode(texts: list[str]) -> list[list[float]]:
        return [[0.1, 0.2, 0.3] for _ in texts]

    def upsert(table: str, rows: list[dict[str, Any]]) -> None:
        upserted[table] = rows

    return upserted, ingest(data, encode, upsert)


def test_ingest_upserts_mechanisms_and_campaigns_and_nothing_else() -> None:
    upserted, summary = _run(KB)

    # Exactly two tables touched — the trends/rubric blocks never reach the DB.
    assert sorted(upserted) == ["creative_campaigns", "creative_mechanisms"]
    assert summary["mechanisms"] == 1
    assert summary["campaigns"] == 1
    assert [c["id"] for c in upserted["creative_campaigns"]] == ["camp_ok"]
    # The embedding is serialized for pgvector.
    assert upserted["creative_mechanisms"][0]["embedding"] == "[0.1, 0.2, 0.3]"


def test_known_duplicate_and_orphan_campaigns_are_skipped_and_reported() -> None:
    _, summary = _run(KB)

    assert summary["skipped_duplicate"] == ["coca_cola_recycle_logo"]
    assert summary["skipped_unknown_mechanism"] == ["camp_orphan"]
    assert summary["needs_sourcing"] == ["camp_orphan"]


def test_format_2026_maps_into_format_note() -> None:
    upserted, _ = _run(KB)

    row = upserted["creative_mechanisms"][0]
    assert row["format_note"] == "short vertical video"
    assert "format_2026" not in row


def test_explicit_format_note_wins_over_year_stamped_field() -> None:
    mech = {**KB["mechanisms"][0], "format_note": "generic note", "format_2026": "old"}
    assert mechanism_row(mech, [0.0])["format_note"] == "generic note"


def test_results_and_confidence_are_stored_verbatim() -> None:
    row = campaign_row(KB["campaigns"][0])
    assert row["results"] == "Sales tripled per the brand."
    assert row["results_confidence"] == "medium (self-reported); high (award)"


def test_embedding_text_falls_back_to_name_definition_why() -> None:
    mech = {"id": "m", "name": "N", "definition": "D.", "why_it_works": "W."}
    assert embedding_text(mech) == "N. D. W."
    assert embedding_text(KB["mechanisms"][0]) == "embed me"
