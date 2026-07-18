import asyncio
import os

import httpx

from app.usage_meter import record_usage


def safe_fetch(url: str) -> str:
    fetcher_url = os.environ["FETCHER_URL"]
    r = httpx.post(f"{fetcher_url}/fetch", json={"url": url}, timeout=10.0)
    r.raise_for_status()
    content: str = r.json()["content"]
    record_usage("fetch")
    return content


async def safe_fetch_async(url: str) -> str:
    """safe_fetch for async agent nodes. Runs in a worker thread so the
    event loop never blocks and parallel research nodes stay parallel."""
    return await asyncio.to_thread(safe_fetch, url)
