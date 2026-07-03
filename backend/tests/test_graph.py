"""Tests for app.graph — model, search, fetch, and retrieval mocked (rule 9: $0)."""

import json
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


MECHANISMS = [
    {
        "id": "mech_x",
        "name": "Mechanism X",
        "definition": "a durable pattern",
        "why_it_works": "distinctiveness",
        "format_note": "works in any era",
        "small_biz_example": "a two-person cafe did it with a phone",
        "budget_level": ["zero", "low"],
        "similarity": 0.9,
        "score": 1.2,
        "example_campaigns": [
            {
                "brand": "BigCo",
                "one_line": "did the thing",
                "results": "won an award",
                "results_confidence": "high (award)",
                "source": "Cannes",
            }
        ],
    },
]

def _concept(title: str, **overrides: str) -> dict[str, str]:
    base = {
        "title": title,
        "mechanism_id": "mech_x",
        "current_trend_used": "short-form POV video",
        "grounded_in": "https://rival-a.example/pricing",
        "execution": "founder films a 30s POV; post to the local hashtag",
        "why_ownable": "only this shop has the anvil-drop tradition",
        "format": "vertical video",
        "budget_fit": "phone camera, zero spend",
    }
    base.update(overrides)
    return base


CONCEPTS_JSON = json.dumps(
    [
        _concept("Safe bet: founder anvil diary"),
        _concept("Bold swing: anvil drop challenge"),
        _concept("Concept 3"),
        _concept("Concept 4"),
    ]
)


def _eval(
    title: str = "Concept",
    overrides: dict[str, int] | None = None,
    flags: list[str] | None = None,
    notes: str = "solid",
) -> dict[str, Any]:
    """A rubric evaluation for one concept; all 9s (passing) unless overridden."""
    scores: dict[str, Any] = dict.fromkeys(graph._rubric_weights(), 9)
    scores.update(overrides or {})
    return {"title": title, "scores": scores, "red_flags_matched": flags or [], "notes": notes}


@dataclass
class PipelineCalls:
    models: list[dict[str, Any]] = field(default_factory=list)
    searches: list[dict[str, Any]] = field(default_factory=list)
    fetches: list[str] = field(default_factory=list)
    retrievals: list[dict[str, Any]] = field(default_factory=list)
    reviewer_responses: list[str] = field(default_factory=list)  # preload per test
    reviewer_reject_all: bool = False
    creative_responses: list[str] = field(default_factory=list)  # preload per test


@pytest.fixture
def pipeline(monkeypatch: pytest.MonkeyPatch) -> PipelineCalls:
    """Mock every external call the graph makes, recording them for assertions."""
    calls = PipelineCalls()

    def fake_call_model(model: str, system: str, user: str, max_tokens: int = 1024) -> str:
        calls.models.append(
            {"model": model, "system": system, "user": user, "max_tokens": max_tokens}
        )
        if "campaign reviewer" in system:
            if calls.reviewer_responses:
                return calls.reviewer_responses.pop(0)
            n = len(json.loads(user)["concepts"])
            if calls.reviewer_reject_all:
                return json.dumps([_eval(overrides={"ownable": 1}) for _ in range(n)])
            return json.dumps([_eval() for _ in range(n)])
        if "creative director" in system:
            if calls.creative_responses:
                return calls.creative_responses.pop(0)
            return CONCEPTS_JSON
        # Findings text: carries the trend the mocked concepts claim to use.
        return "Short-form POV video is surging with local shops right now."

    def fake_search(query: str, max_results: int = 5) -> list[dict[str, str]]:
        calls.searches.append({"query": query, "max_results": max_results})
        return SEARCH_RESULTS[:max_results]

    def fake_fetch(url: str) -> str:
        calls.fetches.append(url)
        return f"<html>page content of {url}</html>"

    def fake_retrieve(
        query: str, business_type: str, goal: str, budget: str, k: int = 5
    ) -> list[dict[str, Any]]:
        calls.retrievals.append(
            {
                "query": query,
                "business_type": business_type,
                "goal": goal,
                "budget": budget,
                "k": k,
            }
        )
        return MECHANISMS

    monkeypatch.setattr(graph, "call_model", fake_call_model)
    monkeypatch.setattr(graph, "search_web", fake_search)
    monkeypatch.setattr(graph, "safe_fetch", fake_fetch)
    monkeypatch.setattr(graph, "retrieve_mechanisms", fake_retrieve)
    return calls


def _initial(mode: Literal["full", "sample"]) -> State:
    return {
        "mode": mode,
        "business": {
            "name": "Acme Anvils",
            "industry": "anvil manufacturing",
            "business_type": "local_service",
            "goal": "foot_traffic",
            "budget": "low",
        },
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
    assert not any("campaign reviewer" in c["system"] for c in pipeline.models)
    assert "__interrupt__" not in out
    # A preview run is fully Haiku — no Sonnet call anywhere in sample mode.
    assert all(c["model"] == HAIKU for c in pipeline.models)
    # The single concept was generated with a low output cap.
    creative_calls = [c for c in pipeline.models if "creative director" in c["system"]]
    assert creative_calls[0]["max_tokens"] == graph._CREATIVE_TOKENS["sample"]
    # Sample mode retrieves fewer mechanisms.
    assert [r["k"] for r in pipeline.retrievals] == [graph._MECHANISMS_K["sample"]]


def test_full_mode_fans_out_loops_on_weak_review_and_pauses_for_human(
    pipeline: PipelineCalls,
) -> None:
    # First review rejects one concept (fails ownable); the refill then passes.
    first_review = [_eval(f"Concept {i}") for i in (1, 2, 3)]
    first_review.append(
        _eval("Concept 4", overrides={"ownable": 2}, notes="too generic for Acme")
    )
    pipeline.reviewer_responses.append(json.dumps(first_review))
    g = graph.build_graph(MemorySaver())
    config = _config("t-full")

    paused = g.invoke(_initial("full"), config)

    # All three research agents ran at the full search cap.
    assert sorted(s["max_results"] for s in pipeline.searches) == [4, 4, 4]
    # The url-less search result was dropped: 3 agents x 2 cited findings.
    assert len(paused["research"]) == 6
    assert all(f["source_url"] for f in paused["research"])
    # The reject sent creative back exactly once, asking for ONE replacement,
    # carrying the machine-computed reason, the reviewer's note, and the kept set.
    creative_calls = [c for c in pipeline.models if "creative director" in c["system"]]
    assert len(creative_calls) == 2
    assert '"concepts_wanted": 1' in creative_calls[1]["user"]
    assert "fails ownable" in creative_calls[1]["user"]
    assert "too generic for Acme" in creative_calls[1]["user"]
    assert '"kept_concepts"' in creative_calls[1]["user"]
    # Passing concepts were kept and every survivor carries its rubric score.
    assert len(paused["concepts"]) == 4
    assert all("score" in c and "rubric_scores" in c for c in paused["concepts"])
    assert paused["review"]["verdict"] == "strong"
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
    pipeline.reviewer_reject_all = True  # every concept fails "ownable" forever
    g = graph.build_graph(MemorySaver())

    paused = g.invoke(_initial("full"), _config("t-capped"))

    creative_calls = [c for c in pipeline.models if "creative director" in c["system"]]
    assert len(creative_calls) == 1 + graph._MAX_REVIEW_LOOPS  # first pass + capped loops
    assert "__interrupt__" in paused  # still reaches the human gate instead of spinning
    assert paused["concepts"] == []  # nothing survived the rubric
    assert paused["review"]["verdict"] == "weak"
    assert paused["review"]["rejected"]


def test_judge_applies_rubric_gates() -> None:
    weights = graph._rubric_weights()
    perfect = dict.fromkeys(weights, 10)

    score, reasons = graph._judge({"scores": perfect, "red_flags_matched": []})
    assert score == 10.0
    assert reasons == []

    score, reasons = graph._judge(
        {"scores": dict.fromkeys(weights, 6), "red_flags_matched": []}
    )
    assert score == 6.0
    assert reasons == [f"weighted score 6.0/10 is below {graph._MIN_SCORE}"]

    _, reasons = graph._judge({"scores": {**perfect, "ownable": 4}, "red_flags_matched": []})
    assert reasons == ["fails ownable — a competitor could run it unchanged"]

    _, reasons = graph._judge(
        {"scores": {**perfect, "budget_realistic": 3}, "red_flags_matched": []}
    )
    assert reasons == ["not realistically executable by a small team on a small budget"]

    _, reasons = graph._judge({"scores": perfect, "red_flags_matched": ["discount-only"]})
    assert reasons == ["matches red flag: discount-only"]


def test_unparseable_review_passes_concepts_through(pipeline: PipelineCalls) -> None:
    pipeline.reviewer_responses.append("not json at all")
    g = graph.build_graph(MemorySaver())

    paused = g.invoke(_initial("full"), _config("t-review-error"))

    creative_calls = [c for c in pipeline.models if "creative director" in c["system"]]
    assert len(creative_calls) == 1  # an infra failure must not trigger the loop
    assert paused["review"]["verdict"] == "error"
    assert len(paused["concepts"]) == 4  # unscored pass-through to the human gate
    assert "__interrupt__" in paused


def test_market_agent_researches_current_trends_dynamically(
    pipeline: PipelineCalls, monkeypatch: pytest.MonkeyPatch
) -> None:
    # A year no dataset could contain proves the query is computed, not hardcoded.
    monkeypatch.setattr(graph, "_current_year", lambda: 2031)
    g = graph.build_graph(MemorySaver())

    paused = g.invoke(_initial("full"), _config("t-trends"))

    assert "anvil manufacturing marketing trends 2031" in [
        s["query"] for s in pipeline.searches
    ]
    # Trend findings are cited like everything else.
    assert paused["research"]
    assert all(f["source_url"] for f in paused["research"])
    # The fresh findings flow through state into the creative step's payload.
    creative_calls = [c for c in pipeline.models if "creative director" in c["system"]]
    assert '"research"' in creative_calls[0]["user"]
    assert "https://rival-a.example/pricing" in creative_calls[0]["user"]


def test_creative_director_fuses_mechanisms_with_live_research(
    pipeline: PipelineCalls, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(graph, "_current_date", lambda: "2031-07-03")  # never hardcoded
    g = graph.build_graph(MemorySaver())

    paused = g.invoke(_initial("full"), _config("t-creative"))

    # Retrieval was driven by this business's profile at the full-mode k.
    assert pipeline.retrievals == [
        {
            "query": pipeline.retrievals[0]["query"],  # asserted separately below
            "business_type": "local_service",
            "goal": "foot_traffic",
            "budget": "low",
            "k": graph._MECHANISMS_K["full"],
        }
    ]
    assert pipeline.retrievals[0]["query"].startswith("foot_traffic")
    # Concepts are parsed JSON: mechanism named, grounded in a real source.
    research_urls = {f["source_url"] for f in paused["research"]}
    for concept in paused["concepts"]:
        assert concept["mechanism_id"] == "mech_x"
        assert concept["grounded_in"] in research_urls
        assert concept["budget_fit"]
    # The creative payload carried the date, findings, and mechanism guidance.
    creative_call = next(c for c in pipeline.models if "creative director" in c["system"])
    assert '"2031-07-03"' in creative_call["user"]
    assert '"research"' in creative_call["user"]
    assert '"mechanisms"' in creative_call["user"]
    assert "a two-person cafe did it with a phone" in creative_call["user"]  # small_biz_example
    assert '"concepts_wanted": 4' in creative_call["user"]
    # The static system block carries the playbook (loaded from the real file).
    assert "Founder-face first" in creative_call["system"]


def test_creative_director_falls_back_when_output_is_not_json(
    pipeline: PipelineCalls,
) -> None:
    pipeline.creative_responses.append("here are some vibes, no JSON")
    g = graph.build_graph(MemorySaver())

    out = g.invoke(_initial("sample"), _config("t-unparsed"))

    assert len(out["concepts"]) == 1
    concept = out["concepts"][0]
    assert concept["title"] == "(unparsed creative output)"
    assert "vibes" in concept["execution"]  # raw text preserved for the reviewer


def test_trend_query_follows_injected_clock_not_a_constant(
    pipeline: PipelineCalls, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Two different injected years must yield two different queries — if a
    # year were hardcoded anywhere, the second assertion would fail.
    state = _initial("full")
    monkeypatch.setattr(graph, "_current_year", lambda: 2031)
    graph.market_agent(state)
    monkeypatch.setattr(graph, "_current_year", lambda: 2032)
    graph.market_agent(state)

    assert [s["query"] for s in pipeline.searches] == [
        "anvil manufacturing marketing trends 2031",
        "anvil manufacturing marketing trends 2032",
    ]


@pytest.mark.usefixtures("pipeline")
def test_concepts_fuse_mechanism_with_trend_from_live_findings() -> None:
    g = graph.build_graph(MemorySaver())

    paused = g.invoke(_initial("full"), _config("t-fusion"))

    findings_text = " ".join(f["text"] for f in paused["research"]).lower()
    research_urls = {f["source_url"] for f in paused["research"]}
    assert paused["concepts"]
    for concept in paused["concepts"]:
        assert concept["mechanism_id"] == "mech_x"  # names its mechanism
        assert concept["grounded_in"] in research_urls  # cites a real finding
        # The trend it claims to ride appears in the LIVE findings, not the file.
        assert concept["current_trend_used"].lower() in findings_text


def test_reviewer_rejects_planted_bad_concepts_then_loop_stops_at_cap(
    pipeline: PipelineCalls,
) -> None:
    # Creative's first batch plants three rejects alongside one good concept.
    pipeline.creative_responses.append(
        json.dumps(
            [
                _concept("Good local mystery hunt"),
                _concept("Discount blast", execution="run a 20% off promo"),
                _concept("Ghost claim", grounded_in=""),
                _concept("National TV takeover", budget_fit="needs a national TV budget"),
            ]
        )
    )
    # Round 1: honest rubric verdicts for the planted batch, in order.
    pipeline.reviewer_responses.append(
        json.dumps(
            [
                _eval("Good local mystery hunt"),
                _eval("Discount blast", flags=["discount-only ('run a 20% off promo')"]),
                _eval(
                    "Ghost claim",
                    overrides={"truth_backed": 1, "surprising_insight": 3, "shareable": 3},
                    notes="no cited source supports it",
                ),
                _eval("National TV takeover", overrides={"budget_realistic": 2}),
            ]
        )
    )
    # Later rounds keep rejecting, so the cap is what ends the loop.
    pipeline.reviewer_reject_all = True
    g = graph.build_graph(MemorySaver())

    paused = g.invoke(_initial("full"), _config("t-bad-concepts"))

    creative_calls = [c for c in pipeline.models if "creative director" in c["system"]]
    # 1 first pass + exactly _MAX_REVIEW_LOOPS revision loops, then it stops.
    assert len(creative_calls) == 1 + graph._MAX_REVIEW_LOOPS
    # The revision kept the good concept (asked for 3 replacements) and
    # carried a distinct machine-computed reason for each planted reject.
    revision = creative_calls[1]["user"]
    assert '"concepts_wanted": 3' in revision
    assert "matches red flag: discount-only" in revision
    assert "is below 7.0" in revision  # the unsourced concept scored under the bar
    assert "not realistically executable by a small team on a small budget" in revision
    assert "__interrupt__" in paused  # capped loop still reaches the human gate
    assert paused["review"]["verdict"] == "weak"


@pytest.mark.usefixtures("pipeline")
def test_good_input_keeps_safe_and_bold_small_budget_concepts() -> None:
    g = graph.build_graph(MemorySaver())

    paused = g.invoke(_initial("full"), _config("t-good"))

    titles = [c["title"] for c in paused["concepts"]]
    assert any(t.startswith("Safe bet") for t in titles)
    assert any(t.startswith("Bold swing") for t in titles)
    for concept in paused["concepts"]:
        assert concept["score"] >= graph._MIN_SCORE
        assert concept["budget_fit"]  # states its small-budget translation
        assert concept["rubric_scores"]["budget_realistic"] >= graph._CRITERION_FAIL


def test_every_system_prompt_marks_web_content_untrusted(pipeline: PipelineCalls) -> None:
    g = graph.build_graph(MemorySaver())

    g.invoke(_initial("sample"), _config("t-untrusted"))

    assert pipeline.models
    assert all("UNTRUSTED DATA" in c["system"] for c in pipeline.models)
