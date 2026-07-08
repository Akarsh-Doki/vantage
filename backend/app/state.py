"""Graph state for the campaign pipeline (see app/graph.py)."""

import operator
from typing import Annotated, Any, Literal, NotRequired, TypedDict

from langgraph.types import Send


class Finding(TypedDict):
    text: str
    source_url: str  # provenance is mandatory — a finding without a source is discarded
    title: NotRequired[str]  # the page title, used as the numbered source's label


class State(TypedDict):
    mode: Literal["full", "sample"]
    business: dict[str, Any]
    plan: dict[str, Any]
    research: Annotated[list[Finding], operator.add]  # parallel agents APPEND here
    brief: dict[str, Any]
    strategy: dict[str, Any]
    concepts: list[dict[str, Any]]
    # Every scored candidate from every review round (passers excluded). Its
    # own channel on purpose: review-dict updates must never wipe it, because
    # it is the safety net that guarantees a report is never delivered with
    # zero concepts.
    concept_pool: list[dict[str, Any]]
    review: dict[str, Any]
    result: dict[str, Any]
    step_count: int
    cost_cents: int


def fan_out(state: State) -> list[Send]:
    """Sample mode runs the competitor agent only; full mode fans out to all three."""
    if state["mode"] == "sample":
        return [Send("competitor_agent", state)]
    return [
        Send("competitor_agent", state),
        Send("audience_agent", state),
        Send("market_agent", state),
    ]
