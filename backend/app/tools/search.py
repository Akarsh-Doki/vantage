"""Web search via Tavily — the web-search entry point for agent research steps.

Results are cached in memory per (query, max_results) for the life of the
process, so repeated identical searches in one pipeline run don't re-charge
the Tavily account. Failures are logged and return [] (CLAUDE.md rule 6:
optional data sources fail quietly, never crash a report); failures are never
cached, so a transient error doesn't poison the rest of the run.
"""

import asyncio
import logging
import os
from typing import Any

from tavily import TavilyClient

logger = logging.getLogger(__name__)

# Rule 7: the backend is a long-lived process — the cache must not grow forever.
_CACHE_MAX_ENTRIES = 1024
_cache: dict[tuple[str, int], list[dict[str, str]]] = {}


def clear_cache() -> None:
    """Drop all cached search results (between pipeline runs, and in tests)."""
    _cache.clear()


def search_web(query: str, max_results: int = 5) -> list[dict[str, str]]:
    """Search the web via Tavily, returning [{title, url, content}, ...].

    Never raises: on a missing API key or any Tavily error it logs and
    returns an empty list.
    """
    key = (query, max_results)
    if key in _cache:
        return _cache[key]

    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        logger.error("TAVILY_API_KEY is not set — returning no results")
        return []

    try:
        client = TavilyClient(api_key=api_key)
        response: dict[str, Any] = client.search(query, max_results=max_results)
        results: list[dict[str, str]] = [
            {
                "title": item.get("title") or "",
                "url": item.get("url") or "",
                "content": item.get("content") or "",
            }
            for item in response.get("results", [])
        ]
    except Exception:
        logger.exception("Tavily search failed for query %r — returning no results", query)
        return []

    if len(_cache) >= _CACHE_MAX_ENTRIES:
        _cache.pop(next(iter(_cache)))  # drop the oldest entry; recency doesn't matter here
    _cache[key] = results
    return results


async def search_web_async(query: str, max_results: int = 5) -> list[dict[str, str]]:
    """search_web for async agent nodes — runs in a worker thread so the
    event loop never blocks and parallel research nodes stay parallel.

    Shares the cache with search_web. Note: only *completed* results are
    cached, so identical queries in flight at the same moment may each reach
    Tavily once.
    """
    return await asyncio.to_thread(search_web, query, max_results)
