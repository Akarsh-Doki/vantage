"""Vantage API entry point (uvicorn app.main:app)."""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app import config
from app.limits import limiter
from app.logging_config import configure_logging
from app.middleware import add_security_headers
from app.routers import reports, sample

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    configure_logging()  # redact secrets from all logs before anything runs
    app = FastAPI(title="Vantage API")

    # CORS locked to the exact frontend origin(s) — no wildcards, and only the
    # methods/headers the frontend actually uses.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.frontend_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )
    add_security_headers(app)

    # Rate limiting (slowapi): the decorators live on the routes; the app just
    # needs the limiter registered and a clear 429 handler.
    app.state.limiter = limiter

    @app.exception_handler(RateLimitExceeded)
    async def rate_limited(_request: Request, _exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests — slow down and try again shortly."},
        )

    app.include_router(reports.router)
    app.include_router(sample.router)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.exception_handler(Exception)
    async def unhandled_error(request: Request, exc: Exception) -> JSONResponse:
        # Full detail goes to the (redacted) logs; clients get a generic
        # message — never a stack trace, never internals (rule 6).
        logger.exception(
            "unhandled error on %s %s", request.method, request.url.path, exc_info=exc
        )
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    return app


app = create_app()
