"""Tests for app.limits — concurrency cap, cost warning, and spend policy.
No network, no HTTP layer; pure/async unit tests."""

import asyncio
import logging
import threading
import time

import pytest

from app import limits


async def test_run_with_slot_caps_concurrency(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GRAPH_CONCURRENCY", "3")
    # Force a fresh semaphore, sized from the env above, on this test's loop.
    limits._semaphore = None
    limits._semaphore_loop = None

    lock = threading.Lock()
    state = {"active": 0, "max": 0}

    def blocking() -> int:
        with lock:
            state["active"] += 1
            state["max"] = max(state["max"], state["active"])
        time.sleep(0.05)
        with lock:
            state["active"] -= 1
        return 1

    results = await asyncio.gather(*[limits.run_with_slot(blocking) for _ in range(9)])

    assert sum(results) == 9  # all ran
    assert state["max"] == 3  # but never more than the cap at once


def test_warn_if_expensive_logs_over_threshold(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    monkeypatch.setenv("COST_WARN_CENTS", "50")

    with caplog.at_level(logging.WARNING):
        limits.warn_if_expensive("run-1", 51)
    assert "over the 50-cent" in caplog.text

    caplog.clear()
    with caplog.at_level(logging.WARNING):
        limits.warn_if_expensive("run-2", 50)  # exactly at threshold: not over
    assert caplog.text == ""


def test_sample_capacity_policy(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DAILY_SAMPLE_CAP", "2")
    assert limits.sample_capacity_available(0) is True
    assert limits.sample_capacity_available(1) is True
    assert limits.sample_capacity_available(2) is False  # cap reached


def test_full_run_decision_policy(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PAID_DAILY_RUN_LIMIT", "3")

    # No profile or no allowance: the wall, before any cost.
    assert limits.full_run_decision(None, 0)[0] == "denied"
    assert limits.full_run_decision({"full_report_credits": 0}, 0)[0] == "denied"

    # Invited users spend a credit; admins never do.
    assert limits.full_run_decision({"full_report_credits": 2}, 0)[0] == "credit"
    assert limits.full_run_decision({"is_admin": True, "full_report_credits": 0}, 0)[0] == "admin"

    # The daily runaway cap outranks everything, admins included (rule 7).
    verdict, reason = limits.full_run_decision({"is_admin": True}, 3)
    assert verdict == "limited"
    assert "daily run limit" in reason.lower()
