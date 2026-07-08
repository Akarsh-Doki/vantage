# Deployment

How to deploy Vantage's three services, wire them together, roll back a bad
deploy, and rotate a leaked key. Plain steps, names only, no secret values.

Vantage is three separate deployables:

| Service | Tech | Host | Public? |
|---|---|---|---|
| Frontend | Next.js (App Router) | Vercel | yes |
| Backend | FastAPI + LangGraph | Render (Docker) | yes |
| Fetcher | Go SSRF-safe fetcher | Render (Docker) | no, internal only |

Data and auth live in Supabase (Postgres, Auth, Row-Level Security). Supabase
is not "deployed" here; you configure it once and point the other services at
it.

Deploy order for a first launch: Supabase (migrations) first, then the fetcher,
then the backend (it needs the fetcher URL), then the frontend (it needs the
backend URL).

---

## 1. Supabase setup (do this first)

### Apply the migrations

The database schema lives in `backend/migrations/*.sql`, applied in numeric
order. For an existing project you only need the two new ones; for a brand new
project apply every file `002` through `007` in order first.

To apply `006` and `007`:

1. Open the Supabase dashboard, pick the project, open the **SQL Editor**.
2. Open a new query. Paste the entire contents of
   `backend/migrations/006_run_display_name.sql`. Click **Run**.
3. Open another new query. Paste the entire contents of
   `backend/migrations/007_full_report_credits.sql`. Click **Run**.
4. Order matters: run `006` before `007`. Both are safe to run once. They use
   `add column if not exists` and `create or replace function`, so re-running a
   file is harmless if you are unsure whether it already applied.

Verify it worked:

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('is_admin', 'full_report_credits');
```

You should see both rows. `007` also creates the `consume_full_report_credit`
and `grant_full_report_credits` functions (service-role only).

### Grant access after migrating

The full report is gated server-side (see the cost-control notes). Once `007`
is applied:

```sql
-- Make yourself unlimited owner/admin.
update public.profiles set is_admin = true
where email = 'you@example.com';

-- Give someone a small allowance (they must have signed in at least once so
-- their profile row exists).
select public.grant_full_report_credits(
  (select id from public.profiles where email = 'invited@example.com'), 2);
```

### Configure Auth URLs

The frontend uses Supabase Auth for sign-in and password reset. In
**Authentication -> URL Configuration**:

- **Site URL**: the production frontend origin (for example
  `https://app.yourdomain.com`).
- **Redirect URLs**: add the frontend origin plus any preview or local origins
  you use (for example `http://localhost:3000`). Email links (password reset,
  confirmation) only work for origins listed here.

### Note the values you will need elsewhere

From **Project Settings -> API** and **Project Settings -> Database**, you will
copy these into the other services (never into git):

- Project URL: used as `SUPABASE_URL` (backend) and `NEXT_PUBLIC_SUPABASE_URL`
  (frontend).
- anon (public) key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend). Public by
  design; RLS is what protects data.
- service_role key: `SUPABASE_SERVICE_KEY` (backend). Secret. Bypasses RLS.
- JWT secret (or the JWKS URL): `SUPABASE_JWT_SECRET` or `SUPABASE_JWKS_URL`
  (backend), used to verify user tokens. Set exactly one.
- Database connection string: `DATABASE_URL` (backend), used by the LangGraph
  checkpointer. Contains the database password.

---

## 2. Fetcher (Go) on Render

The fetcher is the only component allowed to fetch user-supplied URLs, and all
SSRF protection lives inside it. It must not be publicly reachable, so deploy it
as a Render **Private Service** (production) so only the backend can call it.

1. New -> **Private Service**, connect the repo, set the root/Docker context to
   `fetcher/` so `fetcher/Dockerfile` is used.
2. Region: pick the same region you will use for the backend so the internal
   call is fast.
3. Environment variables:

   | Name | Required | Notes |
   |---|---|---|
   | `PORT` | no | Render sets this automatically. The service defaults to `8080` locally. |

   The fetcher needs no secrets and no other configuration.
4. Deploy. Note its internal address (Render shows an internal hostname for
   private services). That address, including the port, is what the backend's
   `FETCHER_URL` will point to.

On the free tier, Render Private Services are limited; if you must use a free
Web Service instead, still prefer its internal URL for `FETCHER_URL` so the
fetcher is not called over the public internet.

---

## 3. Backend (FastAPI) on Render

1. New -> **Web Service**, connect the repo, set the Docker context to
   `backend/` so `backend/Dockerfile` is used.
2. Region: same as the fetcher.
3. Health check path: `/health`.
4. Environment variables:

   **Required**

   | Name | Purpose |
   |---|---|
   | `ANTHROPIC_API_KEY` | Claude model calls (secret). |
   | `TAVILY_API_KEY` | Web search (secret). |
   | `DATABASE_URL` | Postgres for the LangGraph checkpointer (secret; contains the DB password). |
   | `SUPABASE_URL` | Supabase project URL (PostgREST + storage). |
   | `SUPABASE_SERVICE_KEY` | Server-side DB access (secret; bypasses RLS). |
   | `SUPABASE_JWT_SECRET` **or** `SUPABASE_JWKS_URL` | Verify user access tokens. Set exactly one: the JWT secret for HS256 projects, or the JWKS URL for projects using asymmetric signing keys. |
   | `FETCHER_URL` | The fetcher's internal address from step 2 (for example `http://vantage-fetcher:8080`). |
   | `FRONTEND_ORIGIN` | Exact allowed CORS origin(s), comma-separated, no wildcards (for example `https://app.yourdomain.com`). |

   **Model selection (optional, defaults are set in code)**

   | Name | Purpose |
   |---|---|
   | `HAIKU_MODEL` | Model id for high-volume research steps. |
   | `SONNET_MODEL` | Model id for synthesis and creative steps. |

   **Tracing and eval (optional)**

   | Name | Purpose |
   |---|---|
   | `LANGSMITH_TRACING` | `true` to enable LangSmith tracing, otherwise omit. |
   | `LANGSMITH_API_KEY` | LangSmith key (secret), only if tracing is on. |
   | `LANGSMITH_PROJECT` | LangSmith project name (defaults to `vantage`). |
   | `OPENAI_API_KEY` | Used only by the offline eval grader, not by the running service (secret). |

   **Abuse and cost limits (optional, safe defaults in code)**

   | Name | Default |
   |---|---|
   | `RATE_LIMIT_PER_IP` | `5/minute` |
   | `RATE_LIMIT_PER_USER` | `20/minute` |
   | `DAILY_SAMPLE_CAP` | `100` (total free samples across all users per day) |
   | `PAID_DAILY_RUN_LIMIT` | `20` (full runs per user per day) |
   | `GRAPH_CONCURRENCY` | `3` (concurrent graph runs) |
   | `COST_WARN_CENTS` | `100` (log a warning above this per-run cost) |

   You do not set `PORT`; Render provides it and the container's start command
   reads it.

5. Deploy. Note the backend's public URL; the frontend's `NEXT_PUBLIC_API_URL`
   will point to it.

Run exactly one instance. The rate limiter and the graph-concurrency semaphore
are per-process, so a second instance or worker would each keep its own
counters and quietly double the caps. The image already runs a single uvicorn
worker for this reason.

---

## 4. Frontend (Next.js) on Vercel

1. Import the repo into Vercel. Set the **Root Directory** to `frontend/`.
   Framework preset: Next.js. Build and output settings are the defaults.
2. Environment variables (Production, and Preview if you use preview builds):

   | Name | Purpose |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | The backend's public URL from step 3 (for example `https://vantage-api.onrender.com`). |
   | `NEXT_PUBLIC_SUPABASE_URL` | The Supabase project URL. |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The Supabase anon (public) key. |

   Every `NEXT_PUBLIC_*` value is compiled into the browser bundle and is
   public by design. Never put a service-role key or any secret here.

3. Deploy.

Important: because `NEXT_PUBLIC_*` values are baked in at build time, changing
any of them requires a **new build** to take effect. Editing the value in the
Vercel dashboard alone does nothing until you redeploy.

---

## 5. How the services connect

The wiring is four pointers. Get these right and everything talks:

- **Frontend to backend**: `NEXT_PUBLIC_API_URL` on the frontend holds the
  backend's public URL. All API calls go there.
- **Backend to fetcher**: `FETCHER_URL` on the backend holds the fetcher's
  internal address. The Python backend never fetches user URLs directly; it
  always calls the fetcher.
- **Backend CORS to frontend**: `FRONTEND_ORIGIN` on the backend must contain
  the exact frontend origin(s), comma-separated, no wildcards and no trailing
  slash. A browser request from an origin not on this list is blocked. If the
  frontend loads but every API call fails in the browser with a CORS error,
  this is almost always the cause.
- **Both to Supabase**: the frontend uses `NEXT_PUBLIC_SUPABASE_URL` plus the
  anon key; the backend uses `SUPABASE_URL` plus the service key, and verifies
  user tokens with `SUPABASE_JWT_SECRET` or `SUPABASE_JWKS_URL`. The frontend
  and backend Supabase URLs must point at the same project.

Quick post-deploy check:

1. Open the backend URL at `/health`. It should return `{"status": "ok"}`.
2. Open the frontend, sign in, and start a sample report. If the report starts,
   the frontend to backend to Supabase path works. If research completes, the
   fetcher wiring works too.

---

## 6. Rolling back a bad deploy

Both hosts keep previous deploys, so a rollback is a promotion of a known-good
build, not a code revert. Roll back first, fix the code after.

### Vercel (frontend)

1. Project -> **Deployments**.
2. Find the last known-good Production deployment.
3. Open its menu and choose **Promote to Production** (also available as
   `vercel promote` or `vercel rollback` from the CLI).

This is near instant and does not rebuild, because Vercel deployments are
immutable. If the bad deploy was caused by a changed `NEXT_PUBLIC_*` value,
also fix that value, since the good deployment was built with the old one.

### Render (backend and fetcher)

1. Open the service -> **Events** (or the deploy history).
2. Find the last successful deploy and choose **Rollback** (Render redeploys
   that previous image/commit). You can also use **Manual Deploy -> Deploy a
   specific commit**.
3. If the bad deploy was caused by an environment variable change, revert that
   variable too, then trigger the rollback so it runs with the corrected
   config.

Roll back the layer that broke. A backend rollback does not touch the frontend
and vice versa. If a bad backend deploy is breaking the site, roll back the
backend and leave the frontend alone.

---

## 7. Rotating a leaked key

General rule: create the replacement first, update every place that uses it,
confirm the service is healthy, then revoke the old value. For anything
`NEXT_PUBLIC_*`, remember a rebuild is required.

| Key | Where it lives | What to update after rotating |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Console | Backend env on Render. Restart/redeploy. Revoke the old key. |
| `TAVILY_API_KEY` | Tavily dashboard | Backend env on Render. Restart/redeploy. Revoke the old key. |
| `LANGSMITH_API_KEY` | LangSmith settings | Backend env on Render (only if tracing is on). |
| `OPENAI_API_KEY` | OpenAI dashboard | Backend env on Render (eval grader only). |
| `DATABASE_URL` password | Supabase -> Project Settings -> Database (reset database password) | Backend `DATABASE_URL` on Render with the new password. Restart. |

### Supabase keys are linked (read before rotating)

The anon key and the service_role key are both signed by the project's JWT
secret, so you cannot rotate one API key in isolation. Rotating the JWT secret
regenerates both, and it invalidates all existing user sessions (everyone signs
in again). Plan for that.

If the **service_role key** (`SUPABASE_SERVICE_KEY`) or the **JWT secret**
(`SUPABASE_JWT_SECRET`) leaks:

1. In Supabase, rotate the JWT secret (Project Settings -> API, JWT settings).
   This regenerates the anon and service_role keys.
2. Update the backend on Render: `SUPABASE_SERVICE_KEY` and, if you use it,
   `SUPABASE_JWT_SECRET`. Restart the backend.
3. Update the frontend on Vercel: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then
   **redeploy** so the new value is compiled into the bundle.
4. Confirm sign-in and a sample report work end to end, then consider the old
   values dead.

If your project uses the newer Supabase signing keys with `SUPABASE_JWKS_URL`
instead of a shared secret, rotate the signing key in the dashboard; the JWKS
URL stays the same, so the backend needs no change, and you do not need to
reissue the anon key.

The anon key is public by design (RLS enforces access), so an exposed anon key
is not itself a breach. Rotate it only as part of a JWT secret rotation, and
remember the frontend must be rebuilt for the new value to take effect.

---

## 8. Free-tier cold starts

Know this before you demo on free tiers:

- **Render (backend and fetcher)**: free services spin down after about 15
  minutes of inactivity. The next request wakes them, which takes roughly 30 to
  60 seconds. The backend is slower to wake than most apps because its image
  loads torch and the local embedding model at startup; the container's health
  check start-period allows for this. For a demo, send a warm-up request to the
  backend `/health` a minute before you begin, or run a small periodic pinger,
  or move to a paid instance that does not sleep.
- **Supabase (free project)**: a free project pauses after about 7 days of no
  activity and must be resumed from the dashboard before anything works again.
- **Vercel (frontend)**: no meaningful sleep. The static and server-rendered
  pages stay responsive, so a cold backend is what a first visitor will feel,
  not a cold frontend.

The honest failure mode on free tiers is a first request that hangs for the
better part of a minute while Render wakes the backend, then works normally. If
that is unacceptable for a demo, warm the backend first or pay for an
always-on instance.
