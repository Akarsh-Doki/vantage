"""Graph state for the campaign pipeline (see app/graph.py)."""

import operator
from typing import Annotated, Any, Literal, TypedDict

from langgraph.types import Send


class Finding(TypedDict):
    text: str
    source_url: str  # provenance is mandatory — a finding without a source is discarded


class State(TypedDict):
    mode: Literal["full", "sample"]
    business: dict[str, Any]
    plan: dict[str, Any]
    research: Annotated[list[Finding], operator.add]  # parallel agents APPEND here
    brief: dict[str, Any]
    strategy: dict[str, Any]
    concepts: list[dict[str, Any]]
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
