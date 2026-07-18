"""Web search via Tavily. This is the web-search entry point for agent research steps.

Results are cached in memory per (query, max_results) for the life of the
process, so repeated identical searches in one pipeline run don't re-charge
the Tavily account. Failures are logged and return []. CLAUDE.md rule 6 says
optional data sources fail quietly and never crash a report. Failures are never
cached, so a transient error doesn't poison the rest of the run.

Source-quality floor. User-generated, Q&A, forum, and content-farm domains are
never acceptable sources for a cited report. They are excluded in the Tavily
request AND re-filtered from the response (belt and braces, in case the API
ignores or partially applies the exclusion). Finer credibility RANKING among
the surviving results lives in app/graph.py next to the research agents.
"""

import asyncio
import logging
import os
from typing import Any
from urllib.parse import urlparse

from tavily import TavilyClient

from app.usage_meter import record_usage

logger = logging.getLogger(__name__)

# Bound every search so a hung request can't stall a research node.
# Matches the 10s timeout on the Go fetcher call (safe_fetch).
_TIMEOUT_SECONDS = 10.0

# Never cite these. Every entry earned its place in a real run or is the same
# class: forums and Q&A (Quora, Reddit), company-data listing/aggregator sites
# (Owler, Comparably, Craft.co, ZoomInfo, Growjo, Accio), and SEO content
# farms (flavorycooking, byflorr, beanofcoffee).
BLOCKED_DOMAINS: tuple[str, ...] = (
    # forums, Q&A, social boards
    "quora.com",
    "reddit.com",
    "answers.com",
    "answers.yahoo.com",
    "ask.com",
    "stackexchange.com",
    "stackoverflow.com",
    "wikihow.com",
    "ehow.com",
    "hubpages.com",
    "ezinearticles.com",
    "fandom.com",
    "pinterest.com",
    "tumblr.com",
    # company-data listing and scraped-stats aggregators
    "growjo.com",
    "owler.com",
    "comparably.com",
    "craft.co",
    "zoominfo.com",
    "similarweb.com",
    "accio.com",
    "datanyze.com",
    "rocketreach.co",
    # startup directories and market-map aggregators (competitor-query bait)
    "cbinsights.com",
    "apistemic.com",
    "startuphub.ai",
    "producthunt.com",
    "crunchbase.com",
    "pitchbook.com",
    "tracxn.com",
    "getlatka.com",
    "f6s.com",
    "wellfound.com",
    "betalist.com",
    # SEO content farms seen in real runs
    "flavorycooking.com",
    "byflorr.com",
    "beanofcoffee.com",
    # social posts and review-listing pages. Fine products, not citations
    # (m.yelp.com and friends are caught by the subdomain match)
    "yelp.com",
    "instagram.com",
    "tiktok.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "threads.net",
    "tripadvisor.com",
    "trustpilot.com",
    "foursquare.com",
)

# Rule 7: the backend is a long-lived process, so the cache must not grow forever.
_CACHE_MAX_ENTRIES = 1024
_cache: dict[tuple[str, int], list[dict[str, str]]] = {}

def source_host(url: str) -> str:
    """Lowercased host without a www. prefix, or "" for unparseable URLs."""
    try:
        return urlparse(url).netloc.lower().removeprefix("www.")
    except ValueError:
        return ""

def is_blocked_source(url: str) -> bool:
    """True when the URL belongs to a blocked domain (subdomains included)."""
    host = source_host(url)
    if not host:
        return False
    return any(host == domain or host.endswith(f".{domain}") for domain in BLOCKED_DOMAINS)

def clear_cache() -> None:
    """Drop all cached search results (between pipeline runs, and in tests)."""
    _cache.clear()

def search_web(query: str, max_results: int = 5) -> list[dict[str, str]]:
    """Search the web via Tavily, returning [{title, url, content}, ...] with
    blocked (UGC/forum/content-farm) domains removed.

    Never raises. On a missing API key or any Tavily error it logs and
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
        response: dict[str, Any] = client.search(
            query,
            max_results=max_results,
            timeout=_TIMEOUT_SECONDS,
            exclude_domains=list(BLOCKED_DOMAINS),
        )
        results: list[dict[str, str]] = [
            {
                "title": item.get("title") or "",
                "url": item.get("url") or "",
                "content": item.get("content") or "",
            }
            for item in response.get("results", [])
            if not is_blocked_source(item.get("url") or "")
        ]
    except Exception:
        logger.exception("Tavily search failed for query %r — returning no results", query)
        return []
    record_usage("search", model="tavily")  # cache hits above never re-charge

    if len(_cache) >= _CACHE_MAX_ENTRIES:
        _cache.pop(next(iter(_cache)))  # drop the oldest entry, recency doesn't matter here
    _cache[key] = results
    return results

async def search_web_async(query: str, max_results: int = 5) -> list[dict[str, str]]:
    """search_web for async agent nodes. Runs in a worker thread so the
    event loop never blocks and parallel research nodes stay parallel.

    Shares the cache with search_web. Note that only *completed* results are
    cached, so identical queries in flight at the same moment may each reach
    Tavily once.
    """
    return await asyncio.to_thread(search_web, query, max_results)
