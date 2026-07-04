# Security

Every security measure in Vantage, by layer, with what it protects against.
Companion to [threat-model.md](threat-model.md) (the four highest-priority
threats) and CLAUDE.md's hard rules. Concise and factual — code is the source
of truth; this maps the controls to it.

## Authentication — Supabase JWT verification

Every data endpoint depends on `get_current_user` ([backend/app/auth.py](../backend/app/auth.py)),
which verifies the `Authorization: Bearer` token's signature, expiry, and
`authenticated` audience — via `SUPABASE_JWT_SECRET` (HS256) or the project
JWKS URL (RS256/ES256). The user id is taken **only** from the verified `sub`
claim, never from the request body or query params. Missing, malformed, or
expired tokens get 401.

*Protects against:* unauthenticated access, forged/expired tokens, and
identity spoofing by client-supplied ids.

## Authorization — RLS + column grants + explicit scoping

Three independent layers on the same data:

- **Row-Level Security** (migration `005_app_tables.sql`) on every user-data
  table: a user can only read/write rows where `user_id = auth.uid()`.
- **Column-level grants**: clients may update only `reports.deleted_at` (soft
  delete) and `profiles.display_name`; `plan` and `free_sample_used` are
  backend-owned. `usage` is insert+select only (an append-only ledger).
- **Explicit `user_id` scoping in code**: every query in
  [backend/app/db.py](../backend/app/db.py) filters by the authenticated
  `user_id` even though the service role bypasses RLS — RLS is the backstop,
  not the only guard.

*Protects against:* cross-tenant data access, privilege escalation
(self-upgrading to paid), and a bug in one layer becoming a breach.

## Transport & at-rest encryption — platform-provided

TLS in transit (Vercel, Render) and encryption at rest (Supabase/Postgres)
are provided by the hosting platforms; nothing app-side to build. HSTS
(below) tells browsers to refuse plaintext.

*Protects against:* eavesdropping and data theft from storage media.

## Secrets management — env + gitleaks + rotation

All secrets come from environment variables (CLAUDE.md rule 2); none are
committed. `.env` is gitignored; `.env.example` documents the names only. A
`gitleaks` pre-commit hook scans for accidentally staged secrets. Keys are
rotated on suspected exposure.

*Protects against:* credential leakage via source control and drained API
credits from exposed keys.

## Abuse & cost protection

Layered guards ([backend/app/limits.py](../backend/app/limits.py),
[backend/app/config.py](../backend/app/config.py)), all env-configurable:

- **Rate limiting** (slowapi): per-IP and per-user limits, strictest on
  `POST /reports` and `POST /sample` (default 5/min per IP). Over-limit → 429.
- **Global daily free-sample cap** (`DAILY_SAMPLE_CAP`): total samples across
  **all** users per day, counted from `report_runs`. When reached, a friendly
  503 "capacity reached" — never a 500, and the caller's free sample is not
  consumed. This is the account-level guard on Anthropic spend.
- **Concurrency cap** (`GRAPH_CONCURRENCY`, default 3): a global asyncio
  semaphore bounds simultaneous graph runs so a burst can't spawn unbounded
  model calls.
- **Per-user quota**: free plan = one sample total (`profiles.free_sample_used`,
  flipped atomically); paid plan = `PAID_DAILY_RUN_LIMIT` full runs/day.
- **Cost tracking**: every model/search/fetch call is written to the `usage`
  ledger and accumulated into `report_runs.cost_cents`; a run over
  `COST_WARN_CENTS` logs a warning.

*Protects against:* credit-draining bots/traffic spikes, runaway concurrent
cost, and quota abuse.

> **Note:** slowapi's default storage is in-memory (per-process). The durable
> caps (sample cap, daily run limit) are DB-backed and survive restarts;
> move rate-limit storage to Redis when running multiple workers.

## SSRF defense — the Go fetcher owns all user-URL fetching

User-supplied URLs are fetched **only** by the Go fetcher service, which
resolves and rejects private/loopback/link-local addresses and enforces size
and timeout limits. The Python backend never fetches a user URL directly
(CLAUDE.md rule 4). Endpoints validate URL *shape* only; they never fetch.

*Protects against:* server-side request forgery into internal networks and
cloud metadata endpoints.

## Prompt-injection defense — untrusted content as data

Fetched web content and search results are treated as untrusted data, never
instructions (CLAUDE.md rule 5). Every agent system prompt carries an
explicit untrusted-content rule, and all fetched/searched content is passed
to the model **inside the user payload** — never concatenated into a system
prompt. Tests assert both: every system prompt contains the rule, and an
injected directive in fetched content stays in the user payload and doesn't
change the structured output shape.

*Protects against:* fetched pages hijacking the agent to exfiltrate data,
fabricate output, or ignore its instructions.

## Input validation — strict Pydantic

Every request body is a strict Pydantic v2 model ([backend/app/schemas.py](../backend/app/schemas.py))
with `extra="forbid"`: bounded string lengths, enum-validated
business_type/goal/budget, http/https-only URLs, and `competitor_urls` capped
at 5. Invalid input → 422 before any work starts.

*Protects against:* malformed/oversized input, injection via unexpected
fields, and unbounded work from client data.

## CORS lock

CORS ([backend/app/main.py](../backend/app/main.py)) allows only the exact
origin(s) in `FRONTEND_ORIGIN` — no wildcards — and only the methods
(`GET, POST, DELETE, OPTIONS`) and headers (`Authorization, Content-Type`) the
frontend uses. A disallowed origin is never echoed back.

*Protects against:* malicious sites making authenticated cross-origin
requests on a user's behalf.

## Security headers

Middleware ([backend/app/middleware.py](../backend/app/middleware.py)) sets on
every response: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and a restrictive
`Content-Security-Policy` (`default-src 'none'`) for the JSON API. CSP is
relaxed only on the Swagger docs paths so `/docs` still loads; disable `/docs`
in production if not needed.

*Protects against:* clickjacking, MIME-sniffing, referrer leakage, and
downgrade attacks.

## Log hygiene

A redacting formatter ([backend/app/logging_config.py](../backend/app/logging_config.py))
scrubs secrets from every log line after interpolation: JWTs, `Bearer`
tokens, provider key shapes (`sk-`, `sk-ant-`, `tvly-`, `whsec_`,
`sb_secret_`), and generic `key=secret` pairs. Application code does not log
raw request bodies, tokens, or user PII; the formatter is a backstop, and
client errors return a generic message (never a stack trace).

*Protects against:* credential and PII exposure through logs.

## Dependency scanning — Phase 9

Automated dependency scanning (Dependabot, `pip-audit`, `npm audit`) is
scheduled for Phase 9 and not yet enabled.

*Will protect against:* known-vulnerable third-party dependencies.
