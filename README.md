# Vantage

Vantage is an AI marketing team for small businesses: a LangGraph multi-agent pipeline that researches a business and its competitors on the live web, then produces a cited marketing strategy and three distinct creative concepts.

**[Watch the demo](https://youtu.be/ql-4kwhHvpQ)** · **[Open the app](https://vantage-xi-seven.vercel.app)**

<!-- Replace PASTE_LOOM_URL_HERE with the Loom link and PASTE_DEPLOYED_DOMAIN_HERE with the deployed frontend domain. -->

## How it works

You enter your business, website, and competitor URLs. The pipeline then runs:

1. **Planner** turns the business profile into a research plan.
2. **Parallel research agents** (competitor, audience, market) search the live web and read competitor sites through an SSRF-safe fetcher. Low-quality domains are blocked; sources are ranked for credibility.
3. **Synthesis** compresses the findings into a brief where every paragraph carries numbered citations.
4. **Strategy** produces positioning, messaging pillars, and a channel mix.
5. **Creative director and reviewer loop**: concepts are generated from a curated library of proven creative mechanisms, scored against a 10-criterion rubric, and weak or duplicate ideas are sent back for regeneration. The loop is bounded, and the final report always delivers three concepts that differ in mechanism and format.
6. **Human review gate**: you approve the draft before the report is finalized.

Every claim in the deliverable traces to a numbered source. Charts only render when the research supplies cited data; numbers are never invented.

## Stack

| Layer | Tech | Host |
|---|---|---|
| Frontend | Next.js (App Router) | Vercel |
| Backend | FastAPI + LangGraph | Render |
| URL fetcher | Go, SSRF-safe (the only component that touches user-supplied URLs) | Render |
| Data | Supabase: Postgres + pgvector + Auth + Row-Level Security | Supabase |
| Models | Claude Haiku (research) + Claude Sonnet (synthesis, strategy, creative) | Anthropic API |
| Web search | Tavily | |

## Access

The public sample report is open to everyone. Live runs are behind sign-in: every account gets one free sample report, and full reports are controlled per user (an allowance the backend enforces, with rate limits and daily spend caps on top). No payment is collected.

## Repo layout

```
frontend/   Next.js app
backend/    FastAPI + LangGraph pipeline, migrations, evals
fetcher/    Go SSRF-safe URL fetcher
docs/       PRD, architecture, security, deployment
```

## Development

- `make dev-backend`, `make dev-frontend`, `make dev-fetcher` to run services locally
- `make check` runs lint plus the full test pyramid: unit and integration tests with the LLM mocked (zero API spend), SQL-level RLS policy tests on a real Postgres, and Playwright end-to-end tests against a production build
- `make eval ARGS="--dry-run"` exercises the eval harness for free; a bare `make eval` spends real API credits and asks for confirmation first

See [docs/deployment.md](docs/deployment.md) for deploying all three services and [docs/PRD.md](docs/PRD.md) for product decisions.
