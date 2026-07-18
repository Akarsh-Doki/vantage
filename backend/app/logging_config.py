"""Log hygiene: redact secrets and tokens from every log line.

Logs must never carry API keys, JWTs, Authorization headers, or similar
credentials (CLAUDE.md rule 2). A formatter (rather than a filter) does the
redaction so it runs after `msg % args` is rendered, catching secrets that
arrive through interpolation as well as literals.

This scrubs obvious credential shapes defensively. It is a backstop, not a
license to log sensitive data. Application code still must not log raw request
bodies or user PII.
"""

import logging
import re

_REDACTED = "[REDACTED]"

# Ordered, specific-first. Each pattern maps a secret shape to its redaction.
_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    # JWTs (Supabase user tokens, and Supabase anon/service keys are JWTs too)
    (re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"), "[REDACTED_JWT]"),
    # Bearer <token>, consume the token itself (a token never contains spaces)
    (re.compile(r"(?i)\bbearer\s+\S+"), "Bearer " + _REDACTED),
    # Provider key shapes: Anthropic sk-ant-.../sk-..., Tavily tvly-...,
    # webhook whsec_..., Supabase sb_secret_...
    (re.compile(r"\b(?:sk-ant|sk|tvly|whsec|sb)[-_][A-Za-z0-9_-]{6,}"), _REDACTED),
    # Generic secret-ish key/value pairs (api_key=..., "secret": "...", token=...)
    (
        re.compile(
            r"(?i)(api[_-]?key|secret|token|password)"  # key
            r'(["\']?\s*[:=]\s*["\']?)'  # separator
            r"[A-Za-z0-9._\-]{6,}"  # value
        ),
        r"\1\2" + _REDACTED,
    ),
)


def redact(text: str) -> str:
    for pattern, replacement in _PATTERNS:
        text = pattern.sub(replacement, text)
    return text


class RedactingFormatter(logging.Formatter):
    """Formatter that redacts secrets from the fully-rendered log line."""

    def format(self, record: logging.LogRecord) -> str:
        return redact(super().format(record))


def configure_logging(level: int = logging.INFO) -> None:
    """Install the redacting formatter on the root logger's handlers (adding a
    stream handler if none exist). Safe to call more than once."""
    root = logging.getLogger()
    root.setLevel(level)
    if not root.handlers:
        root.addHandler(logging.StreamHandler())
    formatter = RedactingFormatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    for handler in root.handlers:
        handler.setFormatter(formatter)
