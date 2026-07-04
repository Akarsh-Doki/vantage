"""Security-header middleware for the JSON API.

Sets standard hardening headers on every response. The Content-Security-Policy
is locked down for a JSON API (`default-src 'none'`) — but Swagger UI on the
docs endpoints loads scripts/styles from a CDN, so CSP is omitted there (the
other headers still apply). Disable /docs entirely in production if you don't
need it.
"""

from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response

_DOCS_PATHS = ("/docs", "/redoc", "/openapi.json")

_HEADERS = {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
}
_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"


def add_security_headers(app: FastAPI) -> None:
    @app.middleware("http")
    async def _security_headers(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        for header, value in _HEADERS.items():
            response.headers.setdefault(header, value)
        if not request.url.path.startswith(_DOCS_PATHS):
            response.headers.setdefault("Content-Security-Policy", _CSP)
        return response
