# Data Model

Postgres (Supabase). Every user-data table carries `user_id` for tenant isolation and ships with RLS policies — **a table without RLS does not ship** (CLAUDE.md rule 8). All access from the backend uses parameterized queries via the service role; RLS is the backstop, `WHERE user_id = :uid` is still written explicitly.

Conventions: `uuid` PKs (`gen_random_uuid()`), `timestamptz` timestamps with `default now()`, `text` + `CHECK` constraints for enums (cheap to evolve).

Postgres does **not** auto-update `updated_at` — every table with that column gets a `BEFORE UPDATE` trigger calling one shared `set_updated_at()` function (written once, reused per table). Created in the Phase 3 migration.

## profiles — one row per user

Extends `auth.users` (Supabase Auth owns credentials; we never store passwords).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | FK → `auth.users(id) on delete cascade` |
| `email` | `text` | mirrored from auth for convenience |
| `display_name` | `text` | nullable |
| `plan` | `text` | `check (plan in ('free','paid'))`, default `'free'` |
| `free_sample_used` | `boolean` | default `false`; flipped when the one free run starts |
| `created_at` / `updated_at` | `timestamptz` | |

**RLS:** yes. Select/update own row (`id = auth.uid()`); insert via signup trigger; no delete from client.

## projects — a business the user is marketing

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | FK → `profiles(id) on delete cascade`, **indexed** |
| `business_name` | `text` | not null |
| `business_description` | `text` | not null, length-capped (validated in Pydantic *and* `CHECK`) |
| `website_url` | `text` | not null |
| `competitor_urls` | `jsonb` | array of URLs, count-capped |
| `created_at` / `updated_at` | `timestamptz` | |

**RLS:** yes. Full CRUD where `user_id = auth.uid()`.

## report_runs — one pipeline execution (attempt)

Separated from `reports` so retries, failures, and cost accounting don't pollute the finished deliverable. A project has many runs; re-running a saved project (PRD user story) = new row here.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | FK → `profiles(id)`, **indexed** — denormalized for direct RLS, not derived via join |
| `project_id` | `uuid` | FK → `projects(id) on delete cascade` |
| `kind` | `text` | `check (kind in ('sample','full'))` |
| `status` | `text` | `check (status in ('queued','running','awaiting_review','completed','failed'))` |
| `current_step` | `text` | e.g. `research:competitor` — drives the live progress view |
| `error` | `text` | nullable; human-readable failure reason |
| `graph_state` | `jsonb` | LangGraph checkpoint — lets a crashed run resume |
| `tokens_in` / `tokens_out` | `bigint` | running totals across all model calls |
| `cost_cents` | `integer` | integer cents, never float money |
| `started_at` / `finished_at` | `timestamptz` | nullable until reached |
| `created_at` | `timestamptz` | |

**RLS:** yes. Select where `user_id = auth.uid()`; insert/update only by the backend (service role) — clients never mutate run state.

## reports — the finished deliverable

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | FK → `profiles(id)`, **indexed** |
| `project_id` | `uuid` | FK → `projects(id) on delete cascade` |
| `run_id` | `uuid` | FK → `report_runs(id)`, `unique` — one report per successful run |
| `kind` | `text` | `check (kind in ('sample','full'))` |
| `brief` | `jsonb` | synthesis output incl. positioning-gap analysis |
| `strategy` | `jsonb` | user-reviewed/edited strategy |
| `creative` | `jsonb` | slogans/ad copy, each item carrying its quality score and pattern used |
| `sources` | `jsonb` | url/title/snippet per citation; creative items reference these by id (groundedness metric reads this) |
| `deleted_at` | `timestamptz` | nullable, default `null` — soft delete |
| `created_at` | `timestamptz` | |

**RLS:** yes. Select where `user_id = auth.uid()` **and `deleted_at is null`**; the only client write is setting `deleted_at` (soft delete); insert and hard delete by service role only. Soft delete protects users from accidental loss of a paid deliverable and keeps rows available for support/debugging; a scheduled service-role job can purge old soft-deleted rows later.

## usage — append-only cost & quota ledger

One row per model/search call. Answers "has this user used their free sample?", "what did this run cost?", and feeds abuse detection.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | FK → `profiles(id)`, **indexed** |
| `run_id` | `uuid` | FK → `report_runs(id)`, nullable (non-run usage) |
| `kind` | `text` | `check (kind in ('model','search','fetch'))` |
| `model` | `text` | nullable; e.g. `claude-haiku-4-5`, `tavily` |
| `tokens_in` / `tokens_out` | `bigint` | 0 for non-model calls |
| `cost_cents` | `integer` | |
| `occurred_at` | `timestamptz` | default `now()` |

**RLS:** yes. Select own rows only; insert by service role only; **no update/delete for anyone** — it's a ledger.

## search_cache — shared search-result cache

Backs the "never pay for the same lookup twice" rule ([architecture.md](architecture.md)): research agents check here before calling Tavily. Shared product data, **not tenant data** — cache keys are normalized queries, no user content or `user_id`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `cache_key` | `text` | normalized query, `unique`, **indexed** |
| `source` | `text` | `check (source in ('tavily'))` — room for future sources |
| `response` | `jsonb` | the cached API response |
| `created_at` | `timestamptz` | |
| `expires_at` | `timestamptz` | TTL; readers ignore expired rows, a scheduled job purges them |

**RLS:** no user-scoped policies — no client access at all; backend service-role reads/writes only.

## Not user data (for completeness)

The creative-pattern library (curated patterns + pgvector embeddings, with per-pattern source and confidence rating) is shared product content, not tenant data: read-only to the backend, no client access, maintained via migrations/scripts. Documented with the creative agent, not here. `search_cache` above is in the same category.

## Relationships

```
auth.users 1─1 profiles 1─* projects 1─* report_runs 1─0..1 reports
                   │                         │
                   └────────1─* usage *─1────┘   (all rows also carry user_id)
```
