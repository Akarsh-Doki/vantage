"""Abuse and cost protection.

Three layers, each doing what it is best at:
- slowapi rate limits (in-memory, per-process) absorb bursts — per-IP and
  per-user, strictest on the run-starting endpoints;
- DB-backed daily counts are the durable spend caps that survive restarts:
  a GLOBAL free-sample cap protects account-level Anthropic spend, and a
  per-user paid daily run limit bounds a single customer;
- a global asyncio semaphore bounds concurrent graph runs so a spike can't
  spawn unbounded model calls.

Policy decisions live in pure functions (easy to unit-test); all I/O
(counts, profile reads) stays in the routers.
"""

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app import config
from app.auth import decode_token

logger = logging.getLogger(__name__)

T = TypeVar("T")


# --- rate limiting -------------------------------------------------------------
def ip_key(request: Request) -> str:
    """Rate-limit bucket keyed by client IP (the parameter MUST be named
    `request` — slowapi only passes it when the key func declares it)."""
    return f"ip:{get_remote_address(request)}"


def user_key(request: Request) -> str:
    """Rate-limit bucket keyed by the authenticated user; falls back to IP so
    unauthenticated bursts are still bounded. Never raises."""
    header = request.headers.get("authorization", "")
    if header.lower().startswith("bearer "):
        try:
            sub = decode_token(header[7:]).get("sub")
        except Exception:  # a bad token just means "key this request by IP"
            sub = None
        if isinstance(sub, str) and sub:
            return f"user:{sub}"
    return ip_key(request)


# Decorator-based limiting: no middleware needed, but create_app() must set
# app.state.limiter and register the RateLimitExceeded handler.
limiter = Limiter(key_func=ip_key)


# --- concurrency cap -----------------------------------------------------------
_semaphore: asyncio.Semaphore | None = None
_semaphore_loop: asyncio.AbstractEventLoop | None = None


def _slot() -> asyncio.Semaphore:
    # Bind lazily to the running loop, and rebind if the loop changed (uvicorn
    # runs one loop; tests may create a fresh loop per case).
    global _semaphore, _semaphore_loop  # noqa: PLW0603 — lazy per-loop singleton
    loop = asyncio.get_running_loop()
    if _semaphore is None or _semaphore_loop is not loop:
        _semaphore = asyncio.Semaphore(config.graph_concurrency())
        _semaphore_loop = loop
    return _semaphore


async def run_with_slot(fn: Callable[..., T], *args: Any) -> T:
    """Run a blocking graph function in a worker thread, but only while a
    concurrency slot is held — never more than GRAPH_CONCURRENCY at once."""
    async with _slot():
        return await asyncio.to_thread(fn, *args)


BackgroundRunner = Callable[..., Awaitable[None]]


# --- durable spend-cap policy (pure; callers supply the counts) ---------------
def sample_capacity_available(samples_today: int) -> bool:
    """False once today's global free-sample count reaches the cap."""
    return samples_today < config.daily_sample_cap()


def full_run_decision(plan: str | None, runs_today: int) -> tuple[bool, str]:
    """(allowed, reason). Free plans can't start full runs (sample only);
    paid plans are bounded by the configurable daily run limit."""
    if plan != "paid":
        return False, "A full campaign requires a paid plan."
    if runs_today >= config.paid_daily_run_limit():
        return False, "Daily run limit reached for your plan; try again tomorrow."
    return True, ""


# --- cost tracking -------------------------------------------------------------
def warn_if_expensive(run_id: str | None, cost_cents: int) -> None:
    """Log a warning when a single run's cost clears the configured threshold."""
    threshold = config.cost_warn_cents()
    if cost_cents > threshold:
        logger.warning(
            "run %s cost %d cents, over the %d-cent warning threshold",
            run_id,
            cost_cents,
            threshold,
        )
