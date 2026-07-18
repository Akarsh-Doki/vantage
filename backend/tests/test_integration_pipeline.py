"""Integration tier: the REAL FastAPI app driving the REAL compiled LangGraph.

Unlike test_api.py (endpoints against a stand-in graph) and test_graph.py
(the graph without HTTP), these run the full stack: HTTP request -> auth ->
router -> background runner -> compiled graph -> parsers/validators ->
persistence -> HTTP response. Only the tool boundary is mocked (model,
search, fetch, mechanism retrieval), so the run costs $0 (CLAUDE.md rule 9)
while everything the product owns executes for real.

Covered here: the full report lifecycle, user isolation end to end,
rate-limit rejection through the real stack, and the loop/recursion caps
(rule 7) observed as bounded model-call counts.
"""

import json

import pytest
from fastapi.testclient import TestClient
from langgraph.checkpoint.memory import MemorySaver
from test_api import _DB_API, BODY, SECRET, USER_A, USER_B, FakeStore, _auth
from test_graph import CONCEPTS_JSON, MECHANISMS, SEARCH_RESULTS, _eval

from app import db, limits, runner
from app import graph as graph_module
from app.llm import ModelResponse
from app.main import create_app

STRATEGIST_JSON = json.dumps(
    {
        "headline": "Acme Anvils: own the overnight anvil",
        "paragraphs": [{"text": "Rivals sell premium anvils.", "cites": [1]}],
        "tiles": [
            {"label": "Gap", "value": "Overnight delivery", "detail": "Unclaimed"},
            {"label": "Priority", "value": "Short video", "detail": "Lead channel"},
        ],
        "positioning": {
            "statement": "For working smiths who cannot wait, Acme ships overnight.",
            "tagline": "Steel by morning",
        },
        "channels": {
            "items": [
                {"name": "Video", "weight": 60, "rationale": "proof"},
                {"name": "Email", "weight": 40, "rationale": "cadence"},
            ]
        },
    }
)


class ToolCalls:
    """Recorded tool-boundary traffic, for cap and cost assertions."""

    def __init__(self) -> None:
        self.models: list[str] = []
        self.reject_all = False


@pytest.fixture
def integration(
    monkeypatch: pytest.MonkeyPatch,
) -> tuple[TestClient, FakeStore, ToolCalls]:
    """The real app wired to the real graph, tools mocked at the boundary."""
    monkeypatch.setenv("SUPABASE_JWT_SECRET", SECRET)
    monkeypatch.delenv("SUPABASE_JWKS_URL", raising=False)
    monkeypatch.setenv("FRONTEND_ORIGIN", "http://localhost:3000")
    monkeypatch.setenv("RATE_LIMIT_PER_IP", "100000/minute")
    monkeypatch.setenv("RATE_LIMIT_PER_USER", "100000/minute")
    limits.limiter.reset()

    store = FakeStore()
    # Invited-tier users with enough credits for every test in this module.
    store.profiles[USER_A] = {
        "id": USER_A,
        "is_admin": False,
        "full_report_credits": 10,
        "free_sample_used": False,
    }
    store.profiles[USER_B] = {
        "id": USER_B,
        "is_admin": False,
        "full_report_credits": 10,
        "free_sample_used": False,
    }
    for name in _DB_API:
        monkeypatch.setattr(db, name, getattr(store, name))

    calls = ToolCalls()

    def fake_call_model(
        model: str, system: str, user: str, max_tokens: int = 1024
    ) -> ModelResponse:
        calls.models.append(system[:40])
        if "campaign reviewer" in system:
            n = len(json.loads(user)["concepts"])
            overrides = {"ownable": 1} if calls.reject_all else None
            text = json.dumps([_eval(overrides=overrides) for _ in range(n)])
        elif "creative director" in system:
            text = CONCEPTS_JSON
        elif "marketing strategist" in system:
            text = STRATEGIST_JSON
        else:
            text = (
                "Short-form POV video, community challenge formats, local creator"
                " collabs, and QR scavenger hunts are surging with local shops right now."
            )
        return ModelResponse(text=text, tokens_in=100, tokens_out=50)

    monkeypatch.setattr(graph_module, "call_model", fake_call_model)
    monkeypatch.setattr(
        graph_module, "search_web", lambda query, max_results=5: SEARCH_RESULTS[:max_results]
    )
    monkeypatch.setattr(graph_module, "safe_fetch", lambda url: f"<html>{url}</html>")
    monkeypatch.setattr(graph_module, "retrieve_mechanisms", lambda *a, **k: MECHANISMS)

    # The REAL compiled graph (in-memory checkpointer), not a test double.
    real_graph = graph_module.build_graph(MemorySaver())
    monkeypatch.setattr(runner, "_graph", lambda: real_graph)

    return TestClient(create_app()), store, calls


def _creative_calls(calls: ToolCalls) -> int:
    return sum("creative director" in prefix for prefix in calls.models)


def test_full_report_lifecycle_through_real_graph(
    integration: tuple[TestClient, FakeStore, ToolCalls],
) -> None:
    client, store, _ = integration

    created = client.post("/reports", json=BODY, headers=_auth(USER_A))
    assert created.status_code == 202
    run_id = created.json()["run_id"]

    # The real graph paused at the human gate.
    status = client.get(f"/reports/{run_id}", headers=_auth(USER_A)).json()
    assert status["status"] == "awaiting_review"
    assert status["name"] == "Acme Anvils"

    approved = client.post(
        f"/reports/{run_id}/approve", json={"approved": True}, headers=_auth(USER_A)
    )
    assert approved.status_code == 200

    final = client.get(f"/reports/{run_id}", headers=_auth(USER_A)).json()
    assert final["status"] == "completed"
    report = final["report"]
    # Structured deliverable produced by the real parsers and validators.
    assert report["brief"]["headline"] == "Acme Anvils: own the overnight anvil"
    assert len(report["brief"]["tiles"]) == 2
    assert report["strategy"]["positioning"]["tagline"] == "Steel by morning"
    concepts = report["creative"]
    assert len(concepts) == 3
    assert all(isinstance(c.get("score"), float) for c in concepts)
    assert "(unparsed" not in json.dumps(concepts)
    assert [s["n"] for s in report["sources"]] == list(range(1, len(report["sources"]) + 1))
    assert run_id in store.reports


def test_loop_cap_bounds_model_spend_through_the_stack(
    integration: tuple[TestClient, FakeStore, ToolCalls],
) -> None:
    """Rule 7 observed end to end: with a reviewer that rejects everything,
    the run still completes, creative ran exactly first-pass + capped loops,
    and the delivery is a full unlabeled set."""
    client, _, calls = integration
    calls.reject_all = True

    run_id = client.post("/reports", json=BODY, headers=_auth(USER_A)).json()["run_id"]
    client.post(f"/reports/{run_id}/approve", json={"approved": True}, headers=_auth(USER_A))

    final = client.get(f"/reports/{run_id}", headers=_auth(USER_A)).json()
    assert final["status"] == "completed"
    assert _creative_calls(calls) == 1 + graph_module._MAX_REVIEW_LOOPS
    concepts = final["report"]["creative"]
    assert len(concepts) == graph_module._CONCEPTS_WANTED["full"]
    assert all("below_bar" not in c for c in concepts)
    # Hard ceiling on total model traffic for one run (runaway cost is a bug).
    assert len(calls.models) < 30


def test_recursion_limit_is_wired_into_the_compiled_graph() -> None:
    compiled = graph_module.build_graph(MemorySaver())
    assert compiled.config.get("recursion_limit") == graph_module.RECURSION_LIMIT


def test_user_isolation_end_to_end(
    integration: tuple[TestClient, FakeStore, ToolCalls],
) -> None:
    client, _, _ = integration
    run_id = client.post("/reports", json=BODY, headers=_auth(USER_A)).json()["run_id"]

    # Every verb, as the wrong user, against real pipeline-produced data.
    assert client.get(f"/reports/{run_id}", headers=_auth(USER_B)).status_code == 404
    assert (
        client.patch(
            f"/reports/{run_id}", json={"name": "hijack"}, headers=_auth(USER_B)
        ).status_code
        == 404
    )
    assert (
        client.post(
            f"/reports/{run_id}/approve", json={"approved": True}, headers=_auth(USER_B)
        ).status_code
        == 404
    )
    assert client.delete(f"/reports/{run_id}", headers=_auth(USER_B)).status_code == 404
    assert client.get("/reports", headers=_auth(USER_B)).json()["runs"] == []
    # The owner still has full access.
    assert client.get(f"/reports/{run_id}", headers=_auth(USER_A)).status_code == 200


def test_rate_limit_rejects_through_the_real_stack(
    integration: tuple[TestClient, FakeStore, ToolCalls], monkeypatch: pytest.MonkeyPatch
) -> None:
    client, _, _ = integration
    monkeypatch.setenv("RATE_LIMIT_PER_IP", "2/minute")
    limits.limiter.reset()

    codes = [
        client.post("/reports", json=BODY, headers=_auth(USER_A)).status_code for _ in range(3)
    ]

    assert codes == [202, 202, 429]


def test_sample_runs_real_graph_and_is_reopenable(
    integration: tuple[TestClient, FakeStore, ToolCalls],
) -> None:
    client, store, _ = integration

    run_id = client.post("/sample", json=BODY, headers=_auth(USER_A)).json()["run_id"]

    final = client.get(f"/reports/{run_id}", headers=_auth(USER_A)).json()
    assert final["status"] == "completed"
    assert final["kind"] == "sample"
    # Sample stays the reduced deliverable, with no full-mode structured blocks.
    assert "tiles" not in final["report"]["brief"]
    assert len(final["report"]["creative"]) == 1
    assert run_id in store.reports
