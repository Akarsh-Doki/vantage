# Architecture

How Vantage fits together. Product context lives in [PRD.md](PRD.md); non-negotiable rules in [/CLAUDE.md](../CLAUDE.md).

## Components

```
┌──────────────┐     HTTPS/JSON      ┌─────────────────────────┐
│   Frontend    │ ──────────────────▶ │   Backend (Render)       │
│  React + TS   │ ◀────────────────── │   FastAPI + LangGraph    │
│  Vite/Tailwind│   SSE progress      │                          │
│  (Vercel)     │                     │  planner ─▶ research ×3  │
└──────┬───────┘                     │  ─▶ synthesis ─▶ review  │
       │ Auth (JWT)                  │  gate ─▶ creative ─▶ QA  │
       ▼                             └───┬──────┬──────┬───────┘
┌──────────────┐                         │      │      │
│   Supabase    │ ◀───────────────────────┘      │      │
│  Postgres     │  service-role (server)         │      │
│  pgvector     │                          ┌─────▼──┐ ┌─▼──────────┐
│  Auth + RLS   │                          │ Tavily │ │ Go fetcher │
└──────────────┘                          │ search │ │  (Render)  │
                                          └────────┘ └─────┬──────┘
                        Anthropic API                      │ the ONLY
                   Haiku (research) / Sonnet ◀── backend   │ egress to
                   (synthesis, creative, QA)               ▼ user URLs
                                                    competitor sites
```

| Component | Responsibility |
|---|---|
| **Frontend** (React/TS/Vite/Tailwind/shadcn, Vercel) | Landing, auth, dashboard, new-report form, live progress view, report view with sources + quality scores, review/edit gate, export. Talks only to the FastAPI backend and Supabase Auth. |
| **Backend** (FastAPI + LangGraph, Render) | The only place business logic lives. Validates all input (Pydantic), runs the agent pipeline, writes to Postgres via service role, enforces plan limits (free sample vs. paid). |
| **Go fetcher** (Render, private) | The *only* component allowed to fetch user-supplied URLs. SSRF defense lives here (see [threat-model.md](threat-model.md)). Accepts a URL, returns sanitized text/metadata. Not internet-facing; only the backend can call it. |
| **Supabase** | Postgres (app data, [data-model.md](data-model.md)), pgvector (creative-pattern library embeddings), Auth (JWT), RLS on every user-data table. |
| **Anthropic API** | Haiku for planner + research agents (high volume, cheap); Sonnet for synthesis, creative director, and reviewer (quality-critical). |
| **Tavily** | Web search for the customer and market research agents. Results cached in the `search_cache` table ([data-model.md](data-model.md)) with a TTL, so a repeated lookup is never paid for twice. |

## Request Flow: Input → Finished Report

1. **Auth.** User signs in via Supabase Auth; the frontend holds a JWT and sends it on every backend request. The backend verifies the JWT and derives `user_id` from it — never from the request body.
2. **Submit.** Frontend POSTs business description, website URL, and competitor URLs. FastAPI validates with Pydantic (URL shape, counts, lengths), checks the user's plan/quota against `usage`, creates a `project` (or reuses one) and a `report_run` row with status `queued`, and returns the run id immediately.
3. **Progress.** The frontend subscribes to `GET /runs/{id}/events` (SSE). Every node in the graph updates `report_runs.current_step`, which streams to the live progress view. Reconnects fall back to polling the run row.
4. **Plan.** The planner agent (Haiku) reads the validated input and produces a research plan (what to look up, per agent). Graph state is checkpointed to Postgres after every node so a crashed run can resume instead of restarting.
5. **Research (parallel, Haiku).** Three agents fan out:
   - *Competitor agent* — sends each competitor URL to the **Go fetcher**; fetched content comes back sanitized and is wrapped as untrusted data before any LLM sees it.
   - *Customer agent* — Tavily searches on the target customer.
   - *Market agent* — Tavily searches on market and trends.
   Every finding is stored with its source URL. Any single source failing is logged and skipped — a dead competitor site degrades the report, it never kills it.
6. **Synthesis (Sonnet).** Combines research into the brief + positioning-gap analysis, each claim linked to sources.
7. **Review gate (human).** Run status becomes `awaiting_review`; the user can edit/approve the strategy. (Free sample may skip or shorten this per PRD open question.)
8. **Creative (Sonnet).** Creative director retrieves matching proven patterns from the pgvector library and adapts them to this business. Reviewer agent (Sonnet) scores each idea against the rubric; rejected ideas are regenerated — **bounded to N iterations** (hard cap, per CLAUDE.md rule 7).
9. **Persist + deliver.** Final brief, strategy, creative, sources, and quality scores are written to `reports`; token counts and cost to `usage`; run status → `completed`. Frontend renders the report; export produces PDF/copy-ready text.

## Cross-Cutting Rules (enforced in code, summarized here)

- **Failure:** every external call (Anthropic, Tavily, fetcher, DB) has a timeout and bounded retries; a run ends in `completed` or `failed` with a stored error — never hangs. Target: ≥95% run completion (PRD).
- **Cost caps:** per-run token budget, per-node output caps, loop iteration caps, plus the account-level spend cap. A run that hits its budget fails cleanly with a clear error.
- **Isolation:** every query is scoped by `user_id`; RLS is the backstop ([data-model.md](data-model.md)).
- **Trust boundaries:** client input → Pydantic; fetched web content → Go fetcher + untrusted-data prompt wrapping ([threat-model.md](threat-model.md)).
