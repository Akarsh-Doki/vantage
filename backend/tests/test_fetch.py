"""Tests for app.tools.fetch. The Go fetcher call is mocked ($0, no network)."""

from unittest.mock import MagicMock

import httpx
import pytest

from app.tools import fetch


@pytest.fixture
def fake_fetcher(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    """Mock httpx.post so no request ever reaches a real fetcher service."""
    monkeypatch.setenv("FETCHER_URL", "http://fetcher.test:8090")
    response = MagicMock()
    response.json.return_value = {"content": "<html>fetched page</html>"}
    post = MagicMock(return_value=response)
    monkeypatch.setattr(httpx, "post", post)
    return post


async def test_safe_fetch_async_returns_content(fake_fetcher: MagicMock) -> None:
    content = await fetch.safe_fetch_async("https://example.com/page")

    assert content == "<html>fetched page</html>"
    fake_fetcher.assert_called_once_with(
        "http://fetcher.test:8090/fetch",
        json={"url": "https://example.com/page"},
        timeout=10.0,
    )


def test_safe_fetch_reads_fetcher_url_at_call_time(
    fake_fetcher: MagicMock, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("FETCHER_URL", "http://other.test:9000")

    fetch.safe_fetch("https://example.com/")

    assert fake_fetcher.call_args[0][0] == "http://other.test:9000/fetch"
