"""Persistence over Supabase PostgREST.

Every function takes the authenticated user_id and scopes its query with it
explicitly — RLS is the backstop, never the only guard (rules 3, 8). The
PostgREST client builds parameterized requests; no SQL strings are ever
assembled here.
"""

import os
from datetime import UTC, datetime, time
from functools import lru_cache
from typing import Any, cast

from postgrest.types import CountMethod
from supabase import Client, create_client


@lru_cache(maxsize=1)
def _client() -> Client:
    # Lazy: importing this module must not require env (matches the tools).
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def _today_start_iso() -> str:
    """Midnight UTC today — the lower bound for daily spend-cap counts."""
    return datetime.combine(datetime.now(tz=UTC).date(), time.min, tzinfo=UTC).isoformat()


def _rows(data: Any) -> list[dict[str, Any]]:
    return cast("list[dict[str, Any]]", data or [])


def create_project(user_id: str, business: dict[str, Any]) -> str:
    rows = _rows(
        _client()
        .table("projects")
        .insert(
            {
                "user_id": user_id,
                "business_name": business["name"],
                "business_description": business.get("description", ""),
                "website_url": business["website_url"],
                "competitor_urls": business.get("competitor_urls", []),
            }
        )
        .execute()
        .data
    )
    return str(rows[0]["id"])


def create_run(user_id: str, project_id: str, kind: str) -> str:
    rows = _rows(
        _client()
        .table("report_runs")
        .insert({"user_id": user_id, "project_id": project_id, "kind": kind, "status": "queued"})
        .execute()
        .data
    )
    return str(rows[0]["id"])


def update_run(run_id: str, user_id: str, fields: dict[str, Any]) -> None:
    (
        _client()
        .table("report_runs")
        .update(fields)
        .eq("id", run_id)
        .eq("user_id", user_id)
        .execute()
    )


def get_run(run_id: str, user_id: str) -> dict[str, Any] | None:
    rows = _rows(
        _client()
        .table("report_runs")
        # embed the project's business name so responses can fall back to it
        # when no display_name was set
        .select("*, projects(business_name)")
        .eq("id", run_id)
        .eq("user_id", user_id)
        .execute()
        .data
    )
    return rows[0] if rows else None


def rename_run(run_id: str, user_id: str, name: str) -> bool:
    """Set the user-facing display name; False when the run isn't the caller's."""
    rows = _rows(
        _client()
        .table("report_runs")
        .update({"display_name": name})
        .eq("id", run_id)
        .eq("user_id", user_id)
        .execute()
        .data
    )
    return bool(rows)


def count_sample_runs_today() -> int:
    """GLOBAL count of sample runs started today — the account-level spend
    guard. Not user-scoped on purpose: it caps total free samples across all
    users so a bot or traffic spike can't drain Anthropic credits."""
    response = (
        _client()
        .table("report_runs")
        .select("id", count=CountMethod.exact)
        .eq("kind", "sample")
        .gte("created_at", _today_start_iso())
        .execute()
    )
    return response.count or 0


def count_user_runs_today(user_id: str) -> int:
    """This user's full runs started today (for the paid daily run limit)."""
    response = (
        _client()
        .table("report_runs")
        .select("id", count=CountMethod.exact)
        .eq("user_id", user_id)
        .eq("kind", "full")
        .gte("created_at", _today_start_iso())
        .execute()
    )
    return response.count or 0


def get_profile(user_id: str) -> dict[str, Any] | None:
    rows = _rows(_client().table("profiles").select("*").eq("id", user_id).execute().data)
    return rows[0] if rows else None


def list_runs(user_id: str) -> list[dict[str, Any]]:
    return _rows(
        _client()
        .table("report_runs")
        .select("*, projects(business_name)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )


def insert_report(
    user_id: str, project_id: str, run_id: str, kind: str, result: dict[str, Any]
) -> None:
    (
        _client()
        .table("reports")
        .insert(
            {
                "user_id": user_id,
                "project_id": project_id,
                "run_id": run_id,
                "kind": kind,
                "brief": result.get("brief"),
                "strategy": result.get("strategy"),
                "creative": result.get("concepts"),
                "sources": result.get("sources"),
            }
        )
        .execute()
    )


def get_report(run_id: str, user_id: str) -> dict[str, Any] | None:
    """The run's report, excluding soft-deleted rows."""
    rows = _rows(
        _client()
        .table("reports")
        .select("*")
        .eq("run_id", run_id)
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .execute()
        .data
    )
    return rows[0] if rows else None


def report_run_ids(user_id: str) -> set[str]:
    """Run ids that have a live (not soft-deleted) stored deliverable. The
    listing shows a completed run only when its report is actually openable,
    which also hides legacy sample runs from before samples were persisted."""
    rows = _rows(
        _client()
        .table("reports")
        .select("run_id")
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .execute()
        .data
    )
    return {str(r["run_id"]) for r in rows}


def soft_delete_report(run_id: str, user_id: str) -> bool:
    rows = _rows(
        _client()
        .table("reports")
        .update({"deleted_at": now_iso()})
        .eq("run_id", run_id)
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .execute()
        .data
    )
    return bool(rows)


def claim_free_sample(user_id: str) -> bool:
    """Atomically flip the one-free-sample flag; False if already used."""
    rows = _rows(
        _client()
        .table("profiles")
        .update({"free_sample_used": True})
        .eq("id", user_id)
        .eq("free_sample_used", False)
        .execute()
        .data
    )
    return bool(rows)


def release_free_sample(user_id: str) -> None:
    """Refund the sample quota (used when a sample run fails outright)."""
    (_client().table("profiles").update({"free_sample_used": False}).eq("id", user_id).execute())


def insert_usage(
    user_id: str,
    run_id: str | None,
    kind: str,
    model: str | None,
    tokens_in: int,
    tokens_out: int,
    cost_cents: int,
) -> None:
    (
        _client()
        .table("usage")
        .insert(
            {
                "user_id": user_id,
                "run_id": run_id,
                "kind": kind,
                "model": model,
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "cost_cents": cost_cents,
            }
        )
        .execute()
    )
