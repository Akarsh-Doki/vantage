"""Pure scoring functions for the eval harness — no I/O, no model calls, so
they are cheap to unit-test. Orchestration (running the graph, calling the
relevance judge, reporting) lives in run_eval.py."""

import re
from typing import Any

# "SCORE ...: N" (the format the judge is asked for) — capture the integer,
# tolerating a few separators; clamped to 1-5 by the caller below.
_SCORE_RE = re.compile(r"(?i)score\D{0,4}(\d+)")
_OUT_OF_FIVE_RE = re.compile(r"(\d+)\s*/\s*5\b")  # "4/5"
_LONE_1_5_RE = re.compile(r"\b([1-5])\b")  # a standalone 1-5 anywhere
_FENCE_OPEN_RE = re.compile(r"^```[a-zA-Z0-9_-]*\s*")
_FENCE_CLOSE_RE = re.compile(r"\s*```$")


def groundedness(concepts: list[dict[str, Any]], research: list[dict[str, Any]]) -> float:
    """Fraction of creative concepts whose `grounded_in` source_url actually
    appears in the run's research findings. This is the moat metric: a concept
    citing a source that was never found is ungrounded (CLAUDE.md rule 10).

    Returns 0.0 when there are no concepts (nothing was produced to ground)."""
    if not concepts:
        return 0.0
    sources = {f.get("source_url") for f in research if f.get("source_url")}
    grounded = sum(1 for c in concepts if c.get("grounded_in") and c["grounded_in"] in sources)
    return grounded / len(concepts)


def _strip_code_fences(text: str) -> str:
    stripped = _FENCE_OPEN_RE.sub("", text.strip())
    return _FENCE_CLOSE_RE.sub("", stripped)


def parse_relevance_score(text: str) -> int | None:
    """Extract the 1-5 relevance score from the judge's reply, robustly.

    Strips a Markdown code fence, tolerates surrounding prose, and prefers an
    explicit ``SCORE: N`` (checking the first line, where the judge is asked to
    put it, then the whole reply); then ``N/5``; then a standalone 1-5. Values
    from the SCORE / N-of-5 forms are clamped to [1, 5].

    Returns ``None`` when no 1-5 score can be found, so the caller can mark
    relevance unknown instead of silently flooring it to 1."""
    cleaned = _strip_code_fences(text)
    lines = cleaned.splitlines()
    first_line = lines[0] if lines else ""

    for candidate in (first_line, cleaned):
        match = _SCORE_RE.search(candidate)
        if match:
            return max(1, min(5, int(match.group(1))))
    match = _OUT_OF_FIVE_RE.search(cleaned)
    if match:
        return max(1, min(5, int(match.group(1))))
    match = _LONE_1_5_RE.search(cleaned)
    if match:
        return int(match.group(1))
    return None
