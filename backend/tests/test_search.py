"""Tests for app.tools.search — Tavily fully mocked (CLAUDE.md rule 9: $0 to run)."""

import asyncio
import logging
import time
from typing import Any
from unittest.mock import MagicMock

import pytest

from app.tools import search

TAVILY_RESPONSE = {
    "results": [
        {
            "title": "Acme Anvils — About",
            "url": "https://acme.example/about",
            "content": "Acme sells anvils to small businesses.",
            "score": 0.98,
        },
        {
            "title": "Anvil market overview",
            "url": "https://market.example/anvils",
            "content": "A rundown of the anvil market and its main players.",
            "score": 0.61,
        },
    ]
}


def test_search_web_returns_title_url_content(fake_tavily: MagicMock) -> None:
    fake_tavily.search.return_value = TAVILY_RESPONSE

    results = search.search_web("acme competitors", max_results=2)

    assert results == [
        {
            "title": "Acme Anvils — About",
            "url": "https://acme.example/about",
            "content": "Acme sells anvils to small businesses.",
        },
        {
            "title": "Anvil market overview",
            "url": "https://market.example/anvils",
            "content": "A rundown of the anvil market and its main players.",
        },
    ]
    fake_tavily.search.assert_called_once_with(
        "acme competitors", max_results=2, timeout=search._TIMEOUT_SECONDS
    )


def test_identical_search_is_served_from_cache(fake_tavily: MagicMock) -> None:
    fake_tavily.search.return_value = TAVILY_RESPONSE

    first = search.search_web("acme competitors")
    second = search.search_web("acme competitors")

    assert first == second
    fake_tavily.search.assert_called_once()  # second call never reached Tavily

    search.search_web("a different query")
    assert fake_tavily.search.call_count == 2  # a new query is a real search


def test_tavily_error_returns_empty_list_and_is_not_cached(
    fake_tavily: MagicMock, caplog: pytest.LogCaptureFixture
) -> None:
    fake_tavily.search.side_effect = [ConnectionError("tavily is down"), TAVILY_RESPONSE]

    with caplog.at_level(logging.ERROR):
        assert search.search_web("acme competitors") == []
    assert "Tavily search failed" in caplog.text

    # The failure was not cached: the same query retries and now succeeds.
    assert len(search.search_web("acme competitors")) == 2


def test_missing_api_key_returns_empty_list(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    monkeypatch.delenv("TAVILY_API_KEY", raising=False)
    search.clear_cache()

    with caplog.at_level(logging.ERROR):
        assert search.search_web("acme competitors") == []
    assert "TAVILY_API_KEY" in caplog.text


async def test_async_and_sync_share_the_cache(fake_tavily: MagicMock) -> None:
    fake_tavily.search.return_value = TAVILY_RESPONSE

    via_async = await search.search_web_async("acme competitors")
    via_sync = search.search_web("acme competitors")

    assert via_async == via_sync
    fake_tavily.search.assert_called_once()  # the async call populated the cache


async def test_concurrent_searches_run_in_parallel(fake_tavily: MagicMock) -> None:
    def slow_search(*_args: object, **_kwargs: object) -> dict[str, Any]:
        time.sleep(0.25)  # simulated Tavily latency, spent inside the worker thread
        return TAVILY_RESPONSE

    fake_tavily.search.side_effect = slow_search

    start = time.monotonic()
    results = await asyncio.gather(
        search.search_web_async("query one"),
        search.search_web_async("query two"),
        search.search_web_async("query three"),
    )
    elapsed = time.monotonic() - start

    assert [len(r) for r in results] == [2, 2, 2]
    assert fake_tavily.search.call_count == 3
    # Three blocking calls run sequentially would hold the loop >= 0.75s;
    # genuinely parallel threads finish in ~0.25s.
    assert elapsed < 0.6
