"""Tests for app.runner: cost accounting plus the sample-run lifecycle
(deliverable persisted on success, quota refunded on failure). DB and graph
mocked; no network."""

import logging
from collections.abc import Iterator
from types import SimpleNamespace
from typing import Any

import pytest

from app import db, runner
from app.usage_meter import record_usage

_RESULT = {"brief": {"paragraphs": []}, "preview": True}


class _FakeGraph:
    """Streams like the compiled graph; one pricey Sonnet call per run."""

    def __init__(self, fail: bool = False) -> None:
        self.fail = fail

    def stream(
        self, state: dict[str, Any], config: dict[str, Any], stream_mode: str = "updates"
    ) -> Iterator[dict[str, Any]]:
        record_usage("model", "claude-sonnet-5", 1_000_000, 1_000_000)  # 1800 cents
        if self.fail:
            raise RuntimeError("model exploded")
        yield {"planner": {"plan": {}}}
        yield {"finalize": {"result": _RESULT}}

    def get_state(self, config: dict[str, Any]) -> SimpleNamespace:
        return SimpleNamespace(values={"result": _RESULT})


@pytest.fixture
def store(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    """Capture every DB side effect the runner makes."""
    captured: dict[str, Any] = {
        "run": {},
        "usage": [],
        "reports": [],
        "refunds": [],
        "credit_grants": [],
        "profile": {"id": "user-1", "is_admin": False, "full_report_credits": 0},
    }
    monkeypatch.setattr(db, "now_iso", lambda: "2026-07-06T00:00:00+00:00")
    monkeypatch.setattr(db, "get_profile", lambda user_id: captured["profile"])
    monkeypatch.setattr(
        db,
        "grant_full_report_credits",
        lambda user_id, count: captured["credit_grants"].append((user_id, count)),
    )
    monkeypatch.setattr(
        db, "update_run", lambda run_id, user_id, fields: captured["run"].update(fields)
    )
    monkeypatch.setattr(db, "insert_usage", lambda *args: captured["usage"].append(args))
    monkeypatch.setattr(
        db,
        "insert_report",
        lambda user_id, project_id, run_id, kind, result: captured["reports"].append(
            {"run_id": run_id, "kind": kind, "result": result}
        ),
    )
    monkeypatch.setattr(
        db, "release_free_sample", lambda user_id: captured["refunds"].append(user_id)
    )
    return captured


def test_run_records_usage_accumulates_cost_and_warns(
    monkeypatch: pytest.MonkeyPatch, store: dict[str, Any], caplog: pytest.LogCaptureFixture
) -> None:
    monkeypatch.setenv("COST_WARN_CENTS", "100")
    monkeypatch.setattr(runner, "_graph", lambda: _FakeGraph())

    with caplog.at_level(logging.WARNING):
        runner.execute_run("run-1", "proj-1", "user-1", {"name": "Acme"}, "full")

    # Sonnet 1M in + 1M out = (300 + 1500) cents = 1800, recorded to the ledger
    # and accumulated onto the run.
    assert store["usage"]
    assert store["usage"][-1][0] == "user-1"
    assert store["run"]["cost_cents"] == 1800
    assert store["run"]["status"] == "completed"
    # Over the 100-cent threshold → a warning for investigation.
    assert "over the 100-cent" in caplog.text


def test_sample_run_persists_deliverable_like_full_runs(
    monkeypatch: pytest.MonkeyPatch, store: dict[str, Any]
) -> None:
    monkeypatch.setattr(runner, "_graph", lambda: _FakeGraph())

    runner.execute_run("run-s", "proj-1", "user-1", {"name": "Acme"}, "sample")

    assert store["run"]["status"] == "completed"
    # The sample deliverable is stored, so it can be reopened later.
    assert store["reports"] == [{"run_id": "run-s", "kind": "sample", "result": _RESULT}]
    assert store["refunds"] == []  # success consumes the free sample


def test_failed_sample_marks_run_failed_and_refunds_quota(
    monkeypatch: pytest.MonkeyPatch, store: dict[str, Any]
) -> None:
    monkeypatch.setattr(runner, "_graph", lambda: _FakeGraph(fail=True))

    runner.execute_run("run-s", "proj-1", "user-1", {"name": "Acme"}, "sample")

    assert store["run"]["status"] == "failed"
    assert "RuntimeError" in store["run"]["error"]
    assert "Traceback" not in store["run"]["error"]
    assert store["reports"] == []  # nothing delivered
    assert store["refunds"] == ["user-1"]  # the one free sample is given back


def test_failed_full_run_refunds_credit_not_sample_quota(
    monkeypatch: pytest.MonkeyPatch, store: dict[str, Any]
) -> None:
    monkeypatch.setattr(runner, "_graph", lambda: _FakeGraph(fail=True))

    runner.execute_run("run-f", "proj-1", "user-1", {"name": "Acme"}, "full")

    assert store["run"]["status"] == "failed"
    assert store["refunds"] == []  # the sample quota is a separate pool
    # A non-admin only reached the runner by spending a credit; it comes back.
    assert store["credit_grants"] == [("user-1", 1)]


def test_failed_full_run_never_credits_admins(
    monkeypatch: pytest.MonkeyPatch, store: dict[str, Any]
) -> None:
    monkeypatch.setattr(runner, "_graph", lambda: _FakeGraph(fail=True))
    store["profile"]["is_admin"] = True

    runner.execute_run("run-f", "proj-1", "user-1", {"name": "Acme"}, "full")

    assert store["run"]["status"] == "failed"
    assert store["credit_grants"] == []  # nothing was spent, nothing is minted
