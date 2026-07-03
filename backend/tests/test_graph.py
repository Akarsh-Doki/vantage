"""Tests for app.graph — model, search, and fetch all mocked (rule 9: $0 to run)."""

from dataclasses import dataclass, field
from typing import Any, Literal

import pytest
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

from app import graph
from app.llm import HAIKU
from app.state import State

SEARCH_RESULTS = [
    {
        "title": "Rival A pricing",
        "url": "https://rival-a.example/pricing",
        "content": "Rival A sells anvils at premium prices.",
    },
    {
        "title": "Rival B about",
        "url": "https://rival-b.example/about",
        "content": "Rival B ships anvils overnight.",
    },
    {
        "title": "No source",
        "url": "",
        "content": "This result has no URL and must be dropped.",
    },
]


@dataclass
class PipelineCalls:
    models: list[dict[str, Any]] = field(default_factory=list)
    searches: list[dict[str, Any]] = field(default_factory=list)
    fetches: list[str] = field(default_factory=list)
    reviewer_verdicts: list[str] = field(default_factory=list)  # preload per test


@pytest.fixture
def pipeline(monkeypatch: pytest.MonkeyPatch) -> PipelineCalls:
    """Mock every external call the graph makes, recording them for assertions."""
    calls = PipelineCalls()

    def fake_call_model(model: str, system: str, user: str, max_tokens: int = 1024) -> str:
        calls.models.append(
            {"model": model, "system": system, "user": user, "max_tokens": max_tokens}
        )
        if "VERDICT" in system:  # reviewer
            if calls.reviewer_verdicts:
                return calls.reviewer_verdicts.pop(0)
            return "VERDICT: STRONG\nWell grounded in the findings."
        if "creative director" in system:
            return "Concept One\n---\nConcept Two\n---\nConcept Three\n---\nConcept Four"
        return "stub output citing [source: https://rival-a.example/pricing]"

    def fake_search(query: str, max_results: int = 5) -> list[dict[str, str]]:
        calls.searches.append({"query": query, "max_results": max_results})
        return SEARCH_RESULTS[:max_results]

    def fake_fetch(url: str) -> str:
        calls.fetches.append(url)
        return f"<html>page content of {url}</html>"

    monkeypatch.setattr(graph, "call_model", fake_call_model)
    monkeypatch.setattr(graph, "search_web", fake_search)
    monkeypatch.setattr(graph, "safe_fetch", fake_fetch)
    return calls


def _initial(mode: Literal["full", "sample"]) -> State:
    return {
        "mode": mode,
        "business": {"name": "Acme Anvils", "industry": "anvil manufacturing"},
        "plan": {},
        "research": [],
        "brief": {},
        "strategy": {},
        "concepts": [],
        "review": {},
        "result": {},
        "step_count": 0,
        "cost_cents": 0,
    }


def _config(thread_id: str) -> RunnableConfig:
    return {"configurable": {"thread_id": thread_id}}


def test_sample_mode_returns_preview_from_competitor_research_only(
    pipeline: PipelineCalls,
) -> None:
    g = graph.build_graph(MemorySaver())

    out = g.invoke(_initial("sample"), _config("t-sample"))

    result = out["result"]
    assert result["preview"] is True
    assert result["upgrade_hint"]
    assert len(out["concepts"]) == 1  # exactly ONE concept in sample mode
    # Only the competitor agent ran, with the sample search cap.
    assert [s["max_results"] for s in pipeline.searches] == [2]
    # Sample mode fetches only the top competitor page.
    assert pipeline.fetches == ["https://rival-a.example/pricing"]
    # Every finding carries its source.
    assert out["research"]
    assert all(f["source_url"] for f in out["research"])
    # Reviewer and human gate are skipped: no reviewer prompt, no interrupt.
    assert not any("VERDICT" in c["system"] for c in pipeline.models)
    assert "__interrupt__" not in out
    # A preview run is fully Haiku — no Sonnet call anywhere in sample mode.
    assert all(c["model"] == HAIKU for c in pipeline.models)
    # The single concept was generated with a low output cap.
    creative_calls = [c for c in pipeline.models if "creative director" in c["system"]]
    assert creative_calls[0]["max_tokens"] == graph._CREATIVE_TOKENS["sample"]


def test_full_mode_fans_out_loops_on_weak_review_and_pauses_for_human(
    pipeline: PipelineCalls,
) -> None:
    pipeline.reviewer_verdicts.extend(
        ["VERDICT: WEAK\nFix the hook in concept two.", "VERDICT: STRONG\nShip it."]
    )
    g = graph.build_graph(MemorySaver())
    config = _config("t-full")

    paused = g.invoke(_initial("full"), config)

    # All three research agents ran at the full search cap.
    assert sorted(s["max_results"] for s in pipeline.searches) == [4, 4, 4]
    # The url-less search result was dropped: 3 agents x 2 cited findings.
    assert len(paused["research"]) == 6
    assert all(f["source_url"] for f in paused["research"])
    # The weak verdict sent the work back to creative exactly once,
    # and the retry saw the reviewer's feedback.
    creative_calls = [c for c in pipeline.models if "creative director" in c["system"]]
    assert len(creative_calls) == 2
    assert "Fix the hook" in creative_calls[1]["user"]
    # The run is paused on the human_review interrupt, not finished.
    assert "__interrupt__" in paused
    assert paused["result"] == {}

    final = g.invoke(Command(resume={"approved": True}), config)

    assert final["review"]["human"] == {"approved": True}
    assert "preview" not in final["result"]
    assert final["result"]["concepts"] == final["concepts"]
    assert final["result"]["sources"] == [
        "https://rival-a.example/pricing",
        "https://rival-b.example/about",
    ]


def test_review_loop_is_capped_even_if_always_weak(pipeline: PipelineCalls) -> None:
    pipeline.reviewer_verdicts.extend(["VERDICT: WEAK\nStill weak."] * 10)
    g = graph.build_graph(MemorySaver())

    paused = g.invoke(_initial("full"), _config("t-capped"))

    creative_calls = [c for c in pipeline.models if "creative director" in c["system"]]
    assert len(creative_calls) == 1 + graph._MAX_REVIEW_LOOPS  # first pass + capped loops
    assert "__interrupt__" in paused  # still reaches the human gate instead of spinning


def test_every_system_prompt_marks_web_content_untrusted(pipeline: PipelineCalls) -> None:
    g = graph.build_graph(MemorySaver())

    g.invoke(_initial("sample"), _config("t-untrusted"))

    assert pipeline.models
    assert all("UNTRUSTED DATA" in c["system"] for c in pipeline.models)
