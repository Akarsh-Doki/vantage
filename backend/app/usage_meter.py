"""Usage metering hook for the cost/quota ledger.

llm.call_model, tools.search.search_web, and tools.fetch.safe_fetch call
record_usage() after every real external call. Outside a run this is a no-op;
the runner installs a recorder (contextvar-scoped, so parallel runs in one
process never mix ledgers) that writes each event to the usage table.

A ledger failure must never kill a run (rule 6) — recorder errors are logged
and swallowed here, in one place.
"""

import logging
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any

logger = logging.getLogger(__name__)

# (kind, model, tokens_in, tokens_out) -> None
Recorder = Callable[[str, str | None, int, int], None]

_recorder: ContextVar[Recorder | None] = ContextVar("usage_recorder", default=None)


def _as_int(value: Any) -> int:
    # Defensive: token counts come from third-party response objects (and
    # mocks in tests); anything that isn't a real number counts as 0.
    return value if isinstance(value, int) else 0


def record_usage(
    kind: str, model: str | None = None, tokens_in: Any = 0, tokens_out: Any = 0
) -> None:
    recorder = _recorder.get()
    if recorder is None:
        return
    try:
        recorder(kind, model, _as_int(tokens_in), _as_int(tokens_out))
    except Exception:
        logger.exception("usage recorder failed (kind=%s); run continues", kind)


@contextmanager
def usage_recording(recorder: Recorder) -> Iterator[None]:
    token = _recorder.set(recorder)
    try:
        yield
    finally:
        _recorder.reset(token)
