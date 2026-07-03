"""Single entry point for all LLM calls (CLAUDE.md: Haiku for research steps,
Sonnet for synthesis/creative — model choice is a cost decision).

Transient API errors (connection errors, 408/409/429, 5xx) are retried by the
Anthropic SDK itself — up to _MAX_RETRIES times with exponential backoff.
Whatever still fails is raised as ModelCallError: an LLM failure must be a
clear error state the pipeline handles (rule 6), never silently-empty output
that could corrupt a report (rule 10).
"""

import asyncio
import logging
import os
from functools import lru_cache

from anthropic import Anthropic, APIError, APIStatusError

logger = logging.getLogger(__name__)

# Transient-error retries, performed by the SDK with exponential backoff.
_MAX_RETRIES = 2

# Env overrides these (set in .env / Render); defaults track the current tier.
HAIKU = os.environ.get("HAIKU_MODEL", "claude-haiku-4-5")
SONNET = os.environ.get("SONNET_MODEL", "claude-sonnet-5")


class ModelCallError(Exception):
    """An LLM call failed after retries. Callers must treat this as an error
    state (fail the step or degrade gracefully), never as empty output."""


@lru_cache(maxsize=1)
def _get_client() -> Anthropic:
    # Created lazily: importing this module must not require env (see fetch.py).
    return Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"], max_retries=_MAX_RETRIES)


def call_model(model: str, system: str, user: str, max_tokens: int = 1024) -> str:
    """Call the model and return its text. Caches the system prompt, caps output.

    Raises ModelCallError when the call fails after the SDK's bounded retries.
    """
    try:
        resp = _get_client().messages.create(
            model=model,
            max_tokens=max_tokens,
            system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": user}],
        )
    except APIStatusError as e:
        logger.exception("model call failed (model=%s, HTTP %s)", model, e.status_code)
        raise ModelCallError(f"model call failed with HTTP {e.status_code}") from e
    except APIError as e:
        logger.exception("model call failed (model=%s): connection/API error", model)
        raise ModelCallError("model call failed: connection or API error") from e
    return "".join(b.text for b in resp.content if b.type == "text")


async def call_model_async(model: str, system: str, user: str, max_tokens: int = 1024) -> str:
    """call_model for async agent nodes — runs in a worker thread so the
    event loop never blocks and parallel research nodes stay parallel."""
    return await asyncio.to_thread(call_model, model, system, user, max_tokens)
