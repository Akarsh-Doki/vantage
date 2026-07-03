"""Tests for app.llm — Anthropic client fully mocked (CLAUDE.md rule 9: $0 to run)."""

import logging
from unittest.mock import MagicMock

import httpx
import pytest
from anthropic import InternalServerError

from app import llm


def _fake_response(*texts: str) -> MagicMock:
    blocks = []
    for text in texts:
        block = MagicMock()
        block.type = "text"
        block.text = text
        blocks.append(block)
    resp = MagicMock()
    resp.content = blocks
    return resp


def test_call_model_sends_cached_system_prompt_and_max_tokens(fake_anthropic: MagicMock) -> None:
    fake_anthropic.messages.create.return_value = _fake_response("a marketing plan")

    result = llm.call_model(
        "claude-haiku-4-5",
        system="You are a marketing researcher.",
        user="Research competitors of Acme Anvils.",
        max_tokens=2048,
    )

    assert result == "a marketing plan"
    fake_anthropic.messages.create.assert_called_once()
    kwargs = fake_anthropic.messages.create.call_args.kwargs
    assert kwargs["model"] == "claude-haiku-4-5"
    assert kwargs["max_tokens"] == 2048
    assert kwargs["system"] == [
        {
            "type": "text",
            "text": "You are a marketing researcher.",
            "cache_control": {"type": "ephemeral"},
        }
    ]
    assert kwargs["messages"] == [
        {"role": "user", "content": "Research competitors of Acme Anvils."}
    ]


def test_call_model_joins_only_text_blocks(fake_anthropic: MagicMock) -> None:
    resp = _fake_response("first", "second")
    thinking = MagicMock()
    thinking.type = "thinking"
    resp.content.insert(0, thinking)
    fake_anthropic.messages.create.return_value = resp

    assert llm.call_model("claude-haiku-4-5", system="s", user="u") == "firstsecond"


def test_client_is_configured_with_bounded_retries(fake_anthropic: MagicMock) -> None:
    fake_anthropic.messages.create.return_value = _fake_response("ok")

    llm.call_model("claude-haiku-4-5", system="s", user="u")

    # Transient-error retries are delegated to the SDK (backoff included);
    # this pins the bound so it can't silently become unbounded or zero.
    fake_anthropic.constructor.assert_called_once_with(api_key="test-key", max_retries=2)


async def test_call_model_async_returns_same_result_as_sync(fake_anthropic: MagicMock) -> None:
    fake_anthropic.messages.create.return_value = _fake_response("a marketing plan")

    via_async = await llm.call_model_async(
        "claude-haiku-4-5", system="You are a researcher.", user="Find competitors.", max_tokens=512
    )
    via_sync = llm.call_model(
        "claude-haiku-4-5", system="You are a researcher.", user="Find competitors.", max_tokens=512
    )

    assert via_async == via_sync == "a marketing plan"
    # Both paths go through the same call_model; the requests must be identical.
    first, second = fake_anthropic.messages.create.call_args_list
    assert first == second


def test_call_model_raises_model_call_error_when_retries_exhausted(
    fake_anthropic: MagicMock, caplog: pytest.LogCaptureFixture
) -> None:
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    fake_anthropic.messages.create.side_effect = InternalServerError(
        "overloaded",
        response=httpx.Response(529, request=request),
        body=None,
    )

    with caplog.at_level(logging.ERROR), pytest.raises(llm.ModelCallError, match="HTTP 529"):
        llm.call_model("claude-haiku-4-5", system="s", user="u")
    assert "model call failed" in caplog.text
