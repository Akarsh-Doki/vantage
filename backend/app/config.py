"""Env-backed configuration for abuse/cost protection and the HTTP surface.

Every value is read at call time (not cached at import) so deployments and
tests can set env vars without rebuilding the process. All limits are
configurable, and the defaults below are conservative production starting points.
"""

import logging
import os

logger = logging.getLogger(__name__)


def _int_env(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        logger.warning("env %s=%r is not an int; using default %d", name, raw, default)
        return default


def _str_env(name: str, default: str) -> str:
    raw = os.environ.get(name, "").strip()
    return raw or default


# --- rate limits (slowapi limit strings, e.g. "5/minute") ---------------------
def rate_limit_per_ip() -> str:
    return _str_env("RATE_LIMIT_PER_IP", "5/minute")


def rate_limit_per_user() -> str:
    return _str_env("RATE_LIMIT_PER_USER", "20/minute")


# --- durable spend caps (DB-backed counts) ------------------------------------
def daily_sample_cap() -> int:
    """Total free samples allowed across ALL users per day (account-level
    spend guard against a bot draining Anthropic credits)."""
    return _int_env("DAILY_SAMPLE_CAP", 100)


def paid_daily_run_limit() -> int:
    """Full runs a single paid user may start per day."""
    return _int_env("PAID_DAILY_RUN_LIMIT", 20)


# --- concurrency + cost -------------------------------------------------------
def graph_concurrency() -> int:
    """Max graph runs executing at once, so a burst can't spawn unbounded
    model calls."""
    return _int_env("GRAPH_CONCURRENCY", 3)


def cost_warn_cents() -> int:
    """A single run costing more than this logs a warning for investigation."""
    return _int_env("COST_WARN_CENTS", 100)


# --- HTTP surface -------------------------------------------------------------
def frontend_origins() -> list[str]:
    """Exact allowed CORS origins (comma-separated). No wildcards."""
    raw = os.environ.get("FRONTEND_ORIGIN", "")
    return [o.strip() for o in raw.split(",") if o.strip()]
