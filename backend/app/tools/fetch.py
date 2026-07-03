"""URL fetching via the Go fetcher service — the only allowed path for
user-supplied URLs (CLAUDE.md rule 4: SSRF protection lives in the fetcher).
"""

import asyncio
import os

import httpx

from app.usage_meter import record_usage


def safe_fetch(url: str) -> str:
    fetcher_url = os.environ["FETCHER_URL"]  # read at call time: importing must not require env
    r = httpx.post(f"{fetcher_url}/fetch", json={"url": url}, timeout=10.0)
    r.raise_for_status()
    content: str = r.json()["content"]
    record_usage("fetch")  # cost ledger; no-op outside a metered run
    return content


async def safe_fetch_async(url: str) -> str:
    """safe_fetch for async agent nodes — runs in a worker thread so the
    event loop never blocks and parallel research nodes stay parallel."""
    return await asyncio.to_thread(safe_fetch, url)
