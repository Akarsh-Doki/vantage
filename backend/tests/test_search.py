"""Tests for app.tools.search. Tavily fully mocked (CLAUDE.md rule 9: $0 to run)."""

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
        "acme competitors",
        max_results=2,
        timeout=search._TIMEOUT_SECONDS,
        exclude_domains=list(search.BLOCKED_DOMAINS),
    )


def test_blocked_domains_are_filtered_even_if_tavily_returns_them(
    fake_tavily: MagicMock,
) -> None:
    # Belt and braces. The API is asked to exclude these, and the response is
    # re-filtered in case it does not.
    fake_tavily.search.return_value = {
        "results": [
            {"title": "Quora", "url": "https://www.quora.com/anvils", "content": "chatter"},
            {"title": "Sub-forum", "url": "https://old.reddit.com/r/anvils", "content": "chatter"},
            {"title": "Growjo", "url": "https://growjo.com/company/acme", "content": "scraped"},
            {"title": "Trade", "url": "https://adweek.com/anvils", "content": "coverage"},
        ]
    }

    results = search.search_web("anvil market")

    assert [r["url"] for r in results] == ["https://adweek.com/anvils"]


def test_is_blocked_source_covers_subdomains_and_bad_urls() -> None:
    assert search.is_blocked_source("https://www.quora.com/q") is True
    assert search.is_blocked_source("https://es.quora.com/q") is True
    assert search.is_blocked_source("https://quorum.example/q") is False  # not a subdomain
    assert search.is_blocked_source("not a url") is False


def test_social_and_review_listing_sources_are_blocked() -> None:
    # The exact offenders from a real run, plus their class.
    for url in (
        "https://m.yelp.com/biz/blue-bottle-coffee",
        "https://www.instagram.com/p/xyz/",
        "https://www.tiktok.com/@someone/video/1",
        "https://www.tripadvisor.com/Restaurant_Review",
    ):
        assert search.is_blocked_source(url) is True, url
    # Legitimate industry publications stay citable.
    for url in ("https://www.coffeebi.com/report", "https://sca.coffee/research"):
        assert search.is_blocked_source(url) is False, url


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

    # The failure was not cached, so the same query retries and now succeeds.
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
    # Three blocking calls run sequentially would hold the loop >= 0.75s.
    # Genuinely parallel threads finish in ~0.25s.
    assert elapsed < 0.6
