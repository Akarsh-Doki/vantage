"""Tests for app.logging_config — secrets never survive redaction."""

import logging

from app.logging_config import RedactingFormatter, redact


def test_redacts_jwt() -> None:
    token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhYmMifQ.c2lnbmF0dXJlX3BhcnQ"
    out = redact(f"decoded token={token} for user")
    assert token not in out
    assert "[REDACTED_JWT]" in out


def test_redacts_bearer_token_including_opaque() -> None:
    out = redact("Authorization: Bearer abc.def.ghijkl secret request")
    assert "abc.def.ghijkl" not in out
    assert "Bearer [REDACTED]" in out


def test_redacts_provider_keys() -> None:
    for secret in (
        "sk-ant-api03-abcdef123456",
        "tvly-dev-abcdef123456",
        "whsec_abcdef123456",
        "sb_secret_abcdef123456",
    ):
        out = redact(f"loaded key {secret} from env")
        assert secret not in out
        assert "[REDACTED]" in out


def test_formatter_redacts_interpolated_secret() -> None:
    # A secret arriving via %-args (not a literal) must still be scrubbed —
    # this is why redaction is a formatter, not a filter.
    fmt = RedactingFormatter("%(message)s")
    record = logging.LogRecord(
        "vantage", logging.INFO, "path", 1, "api_key=%s", ("supersecretvalue",), None
    )
    out = fmt.format(record)
    assert "supersecretvalue" not in out
    assert "[REDACTED]" in out
