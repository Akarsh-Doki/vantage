-- 005_app_tables.sql — application tables per docs/data-model.md.
-- (Numbered 005 because 004_match_mechanisms.sql already exists.)

-- ── shared updated_at trigger (docs/data-model.md: written once, reused) ──────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles — one row per user, extends auth.users ───────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  plan text not null default 'free' check (plan in ('free', 'paid')),
  free_sample_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- signup: insert a profiles row when a new auth.users row is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── projects — a business the user is marketing ────────────────────────────────
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  business_description text not null
    check (char_length(business_description) <= 2000),
  website_url text not null,
  competitor_urls jsonb not null default '[]'::jsonb
    check (
      jsonb_typeof(competitor_urls) = 'array'
      and jsonb_array_length(competitor_urls) <= 10
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects (user_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ── report_runs — one pipeline execution (attempt) ─────────────────────────────
create table public.report_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,  -- denormalized for direct RLS
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('sample', 'full')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'awaiting_review', 'completed', 'failed')),
  current_step text,
  error text,
  graph_state jsonb,
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  cost_cents integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index report_runs_user_id_idx on public.report_runs (user_id);

-- ── reports — the finished deliverable ─────────────────────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,  -- denormalized for direct RLS
  project_id uuid not null references public.projects(id) on delete cascade,
  run_id uuid not null unique references public.report_runs(id) on delete cascade,
  kind text not null check (kind in ('sample', 'full')),
  brief jsonb,
  strategy jsonb,
  creative jsonb,
  sources jsonb,
  deleted_at timestamptz default null,  -- soft delete; reads filter on "is null"
  created_at timestamptz not null default now()
);

create index reports_user_id_idx on public.reports (user_id);

-- ── usage — append-only cost & quota ledger ────────────────────────────────────
create table public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,  -- denormalized for direct RLS
  run_id uuid references public.report_runs(id) on delete set null,  -- nullable: non-run usage; ledger survives run deletion
  kind text not null check (kind in ('model', 'search', 'fetch')),
  model text,
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  cost_cents integer not null default 0,
  occurred_at timestamptz not null default now()
);

create index usage_user_id_idx on public.usage (user_id);

-- ── search_cache — shared product data, not tenant data ───────────────────────
create table public.search_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,  -- unique constraint doubles as the index
  source text not null check (source in ('tavily')),
  response jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- ── Row-Level Security ─────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.report_runs enable row level security;
alter table public.reports enable row level security;
alter table public.usage enable row level security;
alter table public.search_cache enable row level security;  -- no policies: no client access at all

-- profiles: select/update own row; insert via signup trigger; no client delete
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- projects: full CRUD on own rows
create policy projects_select_own on public.projects
  for select to authenticated
  using (user_id = auth.uid());

create policy projects_insert_own on public.projects
  for insert to authenticated
  with check (user_id = auth.uid());

create policy projects_update_own on public.projects
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy projects_delete_own on public.projects
  for delete to authenticated
  using (user_id = auth.uid());

-- report_runs: clients read own rows; only the backend (service_role) writes
create policy report_runs_select_own on public.report_runs
  for select to authenticated
  using (user_id = auth.uid());

-- reports: read own, hiding soft-deleted; the only client write is the
-- soft delete (enforced per-column by the grant below — RLS cannot limit columns);
-- insert and hard delete are service_role only
create policy reports_select_own on public.reports
  for select to authenticated
  using (user_id = auth.uid() and deleted_at is null);

create policy reports_soft_delete_own on public.reports
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- usage: read own rows; insert by service_role only; no update/delete for
-- anyone (it's a ledger) — enforced by granting neither privilege to any role
create policy usage_select_own on public.usage
  for select to authenticated
  using (user_id = auth.uid());

-- ── grants ─────────────────────────────────────────────────────────────────────
-- Backend (service_role bypasses RLS but still needs table privileges — see 003).
grant select, insert, update, delete
  on public.profiles, public.projects, public.report_runs, public.reports, public.search_cache
  to service_role;
grant select, insert on public.usage to service_role;  -- ledger: no update/delete for anyone

-- Clients: least privilege consistent with the policies above; anon gets nothing.
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;  -- plan / free_sample_used are backend-owned
grant select, insert, update, delete on public.projects to authenticated;
grant select on public.report_runs to authenticated;
grant select on public.reports to authenticated;
grant update (deleted_at) on public.reports to authenticated;  -- soft delete only
grant select on public.usage to authenticated;
