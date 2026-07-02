# ADR 0001: FastAPI for the backend

**Status:** Accepted · 2026-07-02

## Decision

The backend API is Python + FastAPI.

## Why

- The agent pipeline is the product, and the LLM/agent ecosystem (LangGraph, Anthropic SDK, eval tooling) is Python-first. Fighting that from another language costs more than any framework advantage.
- Async-native: a report run is dominated by concurrent I/O (model calls, Tavily, fetcher). FastAPI's asyncio model handles parallel research fan-out and SSE progress streaming without extra machinery.
- Pydantic is built in — CLAUDE.md rule 1 ("validate all input with Pydantic") is enforced at the framework boundary for free, and the same models type the agent state.
- Auto-generated OpenAPI keeps the frontend contract honest with zero upkeep.

## Rejected

- **Django / DRF** — batteries we don't need (ORM admin, templates); weaker async story; Supabase already covers auth and admin.
- **Flask** — no native validation or async-first design; we'd rebuild Pydantic integration and OpenAPI by hand.
- **Node/Express or Go for the API** — splits the codebase away from the Python agent runtime for no gain; Go is used where it actually wins (the fetcher, ADR-scope in threat-model.md).
