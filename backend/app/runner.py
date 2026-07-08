"""Run execution — a standalone module (not inline route code) so it can move
to a task queue later without touching the routes.

Lifecycle (status stays within the report_runs CHECK enum; the finer phases
ride in current_step): queued -> running (research:* .. generating:*) ->
awaiting_review -> running (finalizing) -> completed | failed.

The report_runs id doubles as the checkpointer thread_id, so every run is
durable and resumable. If the graph raises, the run is marked failed with a
short human-readable error — never left hanging (rule 6).
"""

import logging
from functools import lru_cache
from typing import Any, Literal

from langgraph.types import Command

from app import db
from app.graph import build_graph
from app.limits import warn_if_expensive
from app.usage_meter import usage_recording

logger = logging.getLogger(__name__)

_NODE_STEPS = {
    "planner": "planning",
    "competitor_agent": "research:competitor",
    "audience_agent": "research:audience",
    "market_agent": "research:market",
    "synthesis": "synthesis",
    "strategy": "strategy",
    "creative_director": "generating:concepts",
    "reviewer": "generating:review",
    "human_review": "awaiting_review",
    "finalize": "finalizing",
}

# Cents per million tokens (input, output) by model-id prefix. Approximate,
# for the quota/abuse ledger — reconcile billing against Anthropic's console.
# "tavily" is the search tool, priced at $0 on the free tier — an explicit
# zero so search calls record an intentional no-cost rather than tripping the
# "no price configured" warning on every call.
_PRICES_CENTS_PER_MTOK: dict[str, tuple[int, int]] = {
    "claude-haiku-4-5": (100, 500),
    "claude-sonnet-4-5": (300, 1500),
    "claude-sonnet-5": (300, 1500),
    "tavily": (0, 0),
}


@lru_cache(maxsize=1)
def _graph() -> Any:
    # Built once per process; connects the Postgres checkpointer lazily.
    return build_graph()


def _cost_cents(model: str | None, tokens_in: int, tokens_out: int) -> float:
    if not model:
        return 0.0
    for prefix, (rate_in, rate_out) in _PRICES_CENTS_PER_MTOK.items():
        if model.startswith(prefix):
            return (tokens_in * rate_in + tokens_out * rate_out) / 1_000_000
    logger.warning("no price configured for model %s; recording zero cost", model)
    return 0.0


class _RunMeter:
    """Writes one usage row per external call and accumulates run totals."""

    def __init__(self, user_id: str, run_id: str | None) -> None:
        self.user_id = user_id
        self.run_id = run_id
        self.tokens_in = 0
        self.tokens_out = 0
        self.cost_cents = 0.0

    def __call__(self, kind: str, model: str | None, tokens_in: int, tokens_out: int) -> None:
        cost = _cost_cents(model, tokens_in, tokens_out)
        self.tokens_in += tokens_in
        self.tokens_out += tokens_out
        self.cost_cents += cost
        db.insert_usage(self.user_id, self.run_id, kind, model, tokens_in, tokens_out, round(cost))

    def totals(self) -> dict[str, int]:
        return {
            "tokens_in": self.tokens_in,
            "tokens_out": self.tokens_out,
            "cost_cents": round(self.cost_cents),
        }


def _initial_state(business: dict[str, Any], mode: str) -> dict[str, Any]:
    return {
        "mode": mode,
        "business": business,
        "plan": {},
        "research": [],
        "brief": {},
        "strategy": {},
        "concepts": [],
        "concept_pool": [],
        "review": {},
        "result": {},
        "step_count": 0,
        "cost_cents": 0,
    }


def _public_error(exc: Exception) -> str:
    # Human-readable and short; never a traceback, never internals.
    return f"{type(exc).__name__}: {exc}"[:500]


def _config(thread_id: str) -> dict[str, Any]:
    return {"configurable": {"thread_id": thread_id}}


def execute_run(
    run_id: str,
    project_id: str,
    user_id: str,
    business: dict[str, Any],
    mode: Literal["full", "sample"] = "full",
) -> None:
    """Drive a persisted run to the human gate or completion (background task).

    Both kinds persist their deliverable via insert_report on completion, so a
    finished run (sample included) can always be reopened from the dashboard.
    Sample mode never interrupts (no human gate) and, because the user's one
    free sample was claimed before this task started, a failure refunds it."""
    meter = _RunMeter(user_id, run_id)
    try:
        db.update_run(run_id, user_id, {"status": "running", "started_at": db.now_iso()})
        interrupted = False
        with usage_recording(meter):
            for update in _graph().stream(
                _initial_state(business, mode), _config(run_id), stream_mode="updates"
            ):
                if "__interrupt__" in update:
                    interrupted = True
                    continue
                for node in update:
                    step = _NODE_STEPS.get(node)
                    if step:
                        db.update_run(run_id, user_id, {"current_step": step})
        totals = meter.totals()
        warn_if_expensive(run_id, totals["cost_cents"])
        if interrupted:
            db.update_run(
                run_id,
                user_id,
                {"status": "awaiting_review", "current_step": "awaiting_review", **totals},
            )
            return
        result = dict(_graph().get_state(_config(run_id)).values.get("result") or {})
        db.insert_report(user_id, project_id, run_id, mode, result)
        db.update_run(
            run_id,
            user_id,
            {
                "status": "completed",
                "current_step": "done",
                "finished_at": db.now_iso(),
                **totals,
            },
        )
    except Exception as exc:
        logger.exception("run %s failed", run_id)
        totals = meter.totals()
        warn_if_expensive(run_id, totals["cost_cents"])
        db.update_run(
            run_id,
            user_id,
            {
                "status": "failed",
                "error": _public_error(exc),
                "finished_at": db.now_iso(),
                **totals,
            },
        )
        if mode == "sample":
            # They got nothing, so give the one free sample back (rule 6).
            db.release_free_sample(user_id)
        elif mode == "full":
            _refund_full_report_credit(user_id)


def _refund_full_report_credit(user_id: str) -> None:
    """A failed accepted run gives its credit back. Admins never spent one
    (the gate lets them through without decrementing), so they are skipped;
    everyone else reached the runner only by spending exactly one."""
    profile = db.get_profile(user_id)
    if not (profile or {}).get("is_admin"):
        db.grant_full_report_credits(user_id, 1)


def resume_run(
    run_id: str, project_id: str, user_id: str, kind: str, decision: dict[str, Any]
) -> None:
    """Resume the human_review interrupt and finish the run (background task)."""
    meter = _RunMeter(user_id, run_id)
    try:
        with usage_recording(meter):
            final = _graph().invoke(Command(resume=decision), _config(run_id))
        result = dict(final.get("result") or {})
        totals = meter.totals()
        warn_if_expensive(run_id, totals["cost_cents"])
        db.insert_report(user_id, project_id, run_id, kind, result)
        db.update_run(
            run_id,
            user_id,
            {
                "status": "completed",
                "current_step": "done",
                "finished_at": db.now_iso(),
                **totals,
            },
        )
    except Exception as exc:
        logger.exception("resume of run %s failed", run_id)
        totals = meter.totals()
        warn_if_expensive(run_id, totals["cost_cents"])
        db.update_run(
            run_id,
            user_id,
            {
                "status": "failed",
                "error": _public_error(exc),
                "finished_at": db.now_iso(),
                **totals,
            },
        )
        if kind == "full":
            # The credit was spent when the run was accepted; a failure
            # during finalization refunds it the same as any other failure.
            _refund_full_report_credit(user_id)


