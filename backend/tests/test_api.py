"""API tests — graph, DB, and JWT verification all local/mocked; zero network.

JWTs are real HS256 tokens signed with a test secret, so the actual
verification path (signature, expiry, audience, sub) is exercised.
"""

import time
import uuid
from collections.abc import Iterator
from types import SimpleNamespace
from typing import Any

import jwt
import pytest
from fastapi.testclient import TestClient
from langgraph.types import Command

from app import db, runner
from app.main import create_app

SECRET = "test-jwt-secret-0123456789abcdef0123456789abcdef"  # ≥32 bytes for HS256
USER_A = str(uuid.uuid4())
USER_B = str(uuid.uuid4())

BODY: dict[str, Any] = {
    "business_name": "Acme Anvils",
    "industry": "anvil manufacturing",
    "business_type": "local_service",
    "goal": "foot_traffic",
    "budget": "low",
    "website_url": "https://acme.example",
    "competitor_urls": ["https://rival-a.example"],
}

RESULT: dict[str, Any] = {
    "brief": {"text": "the brief"},
    "strategy": {"text": "the strategy"},
    "concepts": [{"title": "Safe bet: founder diary", "score": 9.1}],
    "sources": ["https://rival-a.example/pricing"],
}
SAMPLE_RESULT: dict[str, Any] = {
    **RESULT,
    "preview": True,
    "upgrade_hint": "Run a full campaign for the rest.",
}


def _token(user_id: str, *, exp_delta: int = 3600) -> str:
    now = int(time.time())
    claims = {"sub": user_id, "aud": "authenticated", "iat": now, "exp": now + exp_delta}
    return jwt.encode(claims, SECRET, algorithm="HS256")


def _auth(user_id: str, **kwargs: int) -> dict[str, str]:
    return {"Authorization": f"Bearer {_token(user_id, **kwargs)}"}


class FakeGraph:
    def __init__(self) -> None:
        self.interrupt = False
        self.fail = False
        self.stream_configs: list[dict[str, Any]] = []
        self.resumes: list[tuple[Command[Any], dict[str, Any]]] = []
        self.sample_states: list[dict[str, Any]] = []

    def stream(
        self, state: dict[str, Any], config: dict[str, Any], stream_mode: str = "updates"
    ) -> Iterator[dict[str, Any]]:
        assert stream_mode == "updates"
        assert state["mode"] == "full"
        self.stream_configs.append(config)
        if self.fail:
            raise RuntimeError("model exploded")
        yield {"planner": {"plan": {}}}
        yield {"competitor_agent": {}}
        if self.interrupt:
            yield {"__interrupt__": (object(),)}
            return
        yield {"finalize": {"result": RESULT}}

    def get_state(self, config: dict[str, Any]) -> SimpleNamespace:
        self.stream_configs.append(config)
        return SimpleNamespace(values={"result": RESULT})

    def invoke(self, value: Any, config: dict[str, Any]) -> dict[str, Any]:
        if isinstance(value, Command):
            self.resumes.append((value, config))
            return {"result": RESULT}
        if self.fail:
            raise RuntimeError("model exploded")
        self.sample_states.append(value)
        return {"result": SAMPLE_RESULT}


class FakeStore:
    """In-memory stand-in for app.db — same function signatures."""

    def __init__(self) -> None:
        self.profiles: dict[str, dict[str, Any]] = {}
        self.projects: dict[str, dict[str, Any]] = {}
        self.runs: dict[str, dict[str, Any]] = {}
        self.reports: dict[str, dict[str, Any]] = {}  # keyed by run_id
        self.usage: list[dict[str, Any]] = []

    def create_project(self, user_id: str, business: dict[str, Any]) -> str:
        project_id = str(uuid.uuid4())
        self.projects[project_id] = {"id": project_id, "user_id": user_id, **business}
        return project_id

    def create_run(self, user_id: str, project_id: str, kind: str) -> str:
        run_id = str(uuid.uuid4())
        self.runs[run_id] = {
            "id": run_id,
            "user_id": user_id,
            "project_id": project_id,
            "kind": kind,
            "status": "queued",
            "current_step": None,
            "error": None,
            "created_at": "2026-07-03T00:00:00+00:00",
        }
        return run_id

    def update_run(self, run_id: str, user_id: str, fields: dict[str, Any]) -> None:
        run = self.runs.get(run_id)
        if run and run["user_id"] == user_id:
            run.update(fields)

    def get_run(self, run_id: str, user_id: str) -> dict[str, Any] | None:
        run = self.runs.get(run_id)
        return dict(run) if run and run["user_id"] == user_id else None

    def list_runs(self, user_id: str) -> list[dict[str, Any]]:
        return [dict(r) for r in self.runs.values() if r["user_id"] == user_id]

    def insert_report(
        self, user_id: str, project_id: str, run_id: str, kind: str, result: dict[str, Any]
    ) -> None:
        self.reports[run_id] = {
            "user_id": user_id,
            "project_id": project_id,
            "run_id": run_id,
            "kind": kind,
            "brief": result.get("brief"),
            "strategy": result.get("strategy"),
            "creative": result.get("concepts"),
            "sources": result.get("sources"),
            "deleted_at": None,
        }

    def get_report(self, run_id: str, user_id: str) -> dict[str, Any] | None:
        report = self.reports.get(run_id)
        if report and report["user_id"] == user_id and report["deleted_at"] is None:
            return dict(report)
        return None

    def deleted_report_run_ids(self, user_id: str) -> set[str]:
        return {
            run_id
            for run_id, report in self.reports.items()
            if report["user_id"] == user_id and report["deleted_at"] is not None
        }

    def soft_delete_report(self, run_id: str, user_id: str) -> bool:
        report = self.reports.get(run_id)
        if report and report["user_id"] == user_id and report["deleted_at"] is None:
            report["deleted_at"] = "2026-07-03T00:00:00+00:00"
            return True
        return False

    def claim_free_sample(self, user_id: str) -> bool:
        profile = self.profiles.get(user_id)
        if profile and not profile["free_sample_used"]:
            profile["free_sample_used"] = True
            return True
        return False

    def release_free_sample(self, user_id: str) -> None:
        self.profiles[user_id]["free_sample_used"] = False

    def insert_usage(
        self,
        user_id: str,
        run_id: str | None,
        kind: str,
        model: str | None,
        tokens_in: int,
        tokens_out: int,
        cost_cents: int,
    ) -> None:
        self.usage.append(
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


_DB_API = (
    "create_project",
    "create_run",
    "update_run",
    "get_run",
    "list_runs",
    "insert_report",
    "get_report",
    "deleted_report_run_ids",
    "soft_delete_report",
    "claim_free_sample",
    "release_free_sample",
    "insert_usage",
)


@pytest.fixture
def api(monkeypatch: pytest.MonkeyPatch) -> tuple[TestClient, FakeStore, FakeGraph]:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", SECRET)
    monkeypatch.delenv("SUPABASE_JWKS_URL", raising=False)
    monkeypatch.setenv("FRONTEND_ORIGIN", "http://localhost:5173")
    store = FakeStore()
    store.profiles[USER_A] = {"id": USER_A, "free_sample_used": False}
    store.profiles[USER_B] = {"id": USER_B, "free_sample_used": False}
    for name in _DB_API:
        monkeypatch.setattr(db, name, getattr(store, name))
    fake_graph = FakeGraph()
    monkeypatch.setattr(runner, "_graph", lambda: fake_graph)
    return TestClient(create_app()), store, fake_graph


def test_valid_request_creates_queued_run_and_completes(
    api: tuple[TestClient, FakeStore, FakeGraph],
) -> None:
    client, store, fake_graph = api

    response = client.post("/reports", json=BODY, headers=_auth(USER_A))

    assert response.status_code == 202
    payload = response.json()
    run_id = payload["run_id"]
    assert payload["status"] == "queued"
    # The run row is owner-scoped and, after the background task, completed.
    run = store.runs[run_id]
    assert run["user_id"] == USER_A
    assert run["status"] == "completed"
    assert run_id in store.reports
    # The checkpointer thread_id is the run id — durable and resumable.
    assert fake_graph.stream_configs[0]["configurable"]["thread_id"] == run_id

    status = client.get(f"/reports/{run_id}", headers=_auth(USER_A))
    assert status.status_code == 200
    body = status.json()
    assert body["status"] == "completed"
    assert body["report"]["brief"] == {"text": "the brief"}


def test_unauthenticated_requests_are_401(
    api: tuple[TestClient, FakeStore, FakeGraph],
) -> None:
    client, store, _ = api

    assert client.post("/reports", json=BODY).status_code == 401
    assert client.get("/reports").status_code == 401
    assert client.post("/sample", json=BODY).status_code == 401
    bad = {"Authorization": "Bearer not-a-jwt"}
    assert client.post("/reports", json=BODY, headers=bad).status_code == 401
    expired = _auth(USER_A, exp_delta=-60)
    assert client.post("/reports", json=BODY, headers=expired).status_code == 401
    assert store.runs == {}  # nothing was created without auth


def test_cannot_read_another_users_run(
    api: tuple[TestClient, FakeStore, FakeGraph],
) -> None:
    client, _, _ = api
    run_id = client.post("/reports", json=BODY, headers=_auth(USER_A)).json()["run_id"]

    assert client.get(f"/reports/{run_id}", headers=_auth(USER_B)).status_code == 404
    assert client.delete(f"/reports/{run_id}", headers=_auth(USER_B)).status_code == 404
    approve = client.post(
        f"/reports/{run_id}/approve", json={"approved": True}, headers=_auth(USER_B)
    )
    assert approve.status_code == 404
    # The owner still sees it.
    assert client.get(f"/reports/{run_id}", headers=_auth(USER_A)).status_code == 200


def test_over_limit_competitor_urls_rejected(
    api: tuple[TestClient, FakeStore, FakeGraph],
) -> None:
    client, store, _ = api
    body = {**BODY, "competitor_urls": [f"https://rival-{i}.example" for i in range(6)]}

    assert client.post("/reports", json=body, headers=_auth(USER_A)).status_code == 422
    non_http = {**BODY, "competitor_urls": ["ftp://rival.example"]}
    assert client.post("/reports", json=non_http, headers=_auth(USER_A)).status_code == 422
    assert store.runs == {}


def test_free_sample_gate_rejects_second_sample(
    api: tuple[TestClient, FakeStore, FakeGraph],
) -> None:
    client, store, fake_graph = api

    first = client.post("/sample", json=BODY, headers=_auth(USER_A))
    assert first.status_code == 200
    payload = first.json()
    assert payload["preview"] is True
    assert payload["upgrade_hint"]
    assert fake_graph.sample_states[0]["mode"] == "sample"
    assert store.profiles[USER_A]["free_sample_used"] is True

    second = client.post("/sample", json=BODY, headers=_auth(USER_A))
    assert second.status_code == 402


def test_graph_failure_marks_run_failed_with_readable_error(
    api: tuple[TestClient, FakeStore, FakeGraph],
) -> None:
    client, store, fake_graph = api
    fake_graph.fail = True

    run_id = client.post("/reports", json=BODY, headers=_auth(USER_A)).json()["run_id"]

    run = store.runs[run_id]
    assert run["status"] == "failed"
    assert "RuntimeError" in run["error"]
    assert "Traceback" not in run["error"]
    status = client.get(f"/reports/{run_id}", headers=_auth(USER_A)).json()
    assert status["status"] == "failed"
    assert status["error"]


def test_approve_resumes_only_awaiting_review_runs(
    api: tuple[TestClient, FakeStore, FakeGraph],
) -> None:
    client, store, fake_graph = api
    fake_graph.interrupt = True
    run_id = client.post("/reports", json=BODY, headers=_auth(USER_A)).json()["run_id"]
    assert store.runs[run_id]["status"] == "awaiting_review"

    response = client.post(
        f"/reports/{run_id}/approve",
        json={"approved": True, "feedback": "ship it"},
        headers=_auth(USER_A),
    )

    assert response.status_code == 200
    command, config = fake_graph.resumes[0]
    assert command.resume == {"approved": True, "feedback": "ship it"}
    assert config["configurable"]["thread_id"] == run_id
    assert store.runs[run_id]["status"] == "completed"
    assert run_id in store.reports

    # A run that is not awaiting review cannot be approved.
    again = client.post(
        f"/reports/{run_id}/approve", json={"approved": True}, headers=_auth(USER_A)
    )
    assert again.status_code == 409


def test_cost_cents_uses_model_rates() -> None:
    # Haiku: $1/$5 per MTok -> 100/500 cents; Sonnet: $3/$15 -> 300/1500.
    assert runner._cost_cents("claude-haiku-4-5", 1_000_000, 1_000_000) == 600.0
    assert runner._cost_cents("claude-sonnet-5", 2_000_000, 0) == 600.0
    assert runner._cost_cents("unknown-model", 1_000_000, 0) == 0.0
    assert runner._cost_cents(None, 5, 5) == 0.0


def test_soft_delete_hides_report_from_reads(
    api: tuple[TestClient, FakeStore, FakeGraph],
) -> None:
    client, _, _ = api
    run_id = client.post("/reports", json=BODY, headers=_auth(USER_A)).json()["run_id"]

    deleted = client.delete(f"/reports/{run_id}", headers=_auth(USER_A))
    assert deleted.status_code == 200
    assert deleted.json() == {"run_id": run_id, "deleted": True}
    # Gone from reads, and a second delete finds nothing.
    assert client.get(f"/reports/{run_id}", headers=_auth(USER_A)).status_code == 404
    listing = client.get("/reports", headers=_auth(USER_A)).json()
    assert listing["runs"] == []
    assert client.delete(f"/reports/{run_id}", headers=_auth(USER_A)).status_code == 404
