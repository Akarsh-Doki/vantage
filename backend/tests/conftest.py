"""Shared pytest fixtures.

Under CLAUDE.md rule 9, every LLM call is mocked here so tests cost $0.
"""

from collections.abc import Iterator
from unittest.mock import MagicMock

import pytest

from app import llm
from app.tools import search


@pytest.fixture
def fake_tavily(monkeypatch: pytest.MonkeyPatch) -> Iterator[MagicMock]:
    """A mocked Tavily client wired into app.tools.search, so searches cost $0.

    Yields the client mock. Set `.search.return_value` / `.side_effect` per test.
    Clears the search cache on both sides so tests can't leak results into
    each other.
    """
    monkeypatch.setenv("TAVILY_API_KEY", "test-key")
    search.clear_cache()
    client = MagicMock()
    monkeypatch.setattr(search, "TavilyClient", MagicMock(return_value=client))
    yield client
    search.clear_cache()


@pytest.fixture
def fake_anthropic(monkeypatch: pytest.MonkeyPatch) -> Iterator[MagicMock]:
    """A mocked Anthropic client wired into app.llm, so model calls cost $0.

    Yields the client mock. Set `.messages.create.return_value` / `.side_effect`
    per test. The mocked class is exposed as `client.constructor` so tests can
    assert construction kwargs (api_key, max_retries). Clears the cached client
    on both sides so tests can't leak the mock into each other.
    """
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    llm._get_client.cache_clear()
    client = MagicMock()
    constructor = MagicMock(return_value=client)
    monkeypatch.setattr(llm, "Anthropic", constructor)
    client.constructor = constructor
    yield client
    llm._get_client.cache_clear()
