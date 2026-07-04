"""Tests for app.runner cost accounting — usage recorded and accumulated,
threshold warning fired. DB and graph mocked; no network."""

import logging
from typing import Any

import pytest

from app import db, runner
from app.usage_meter import record_usage


class _UsageGraph:
    """A graph whose run makes one pricey Sonnet call via the usage hook."""

    def invoke(self, state: dict[str, Any], config: dict[str, Any]) -> dict[str, Any]:
        record_usage("model", "claude-sonnet-5", 1_000_000, 1_000_000)  # 1800 cents
        return {"result": {"preview": True}}


def test_run_records_usage_accumulates_cost_and_warns(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    monkeypatch.setenv("COST_WARN_CENTS", "100")
    final_update: dict[str, Any] = {}
    usage_rows: list[tuple[Any, ...]] = []

    monkeypatch.setattr(runner, "_graph", lambda: _UsageGraph())
    monkeypatch.setattr(db, "now_iso", lambda: "2026-07-03T00:00:00+00:00")
    monkeypatch.setattr(
        db, "update_run", lambda run_id, user_id, fields: final_update.update(fields)
    )
    monkeypatch.setattr(db, "insert_usage", lambda *args: usage_rows.append(args))

    with caplog.at_level(logging.WARNING):
        result = runner.run_sample("run-1", "user-1", {"name": "Acme"})

    assert result == {"preview": True}
    # Sonnet 1M in + 1M out = (300 + 1500) cents = 1800, recorded to the ledger
    # and accumulated onto the run.
    assert usage_rows
    assert usage_rows[-1][0] == "user-1"
    assert final_update["cost_cents"] == 1800
    assert final_update["status"] == "completed"
    # Over the 100-cent threshold → a warning for investigation.
    assert "over the 100-cent" in caplog.text
