-- 007: cost-control allowance for full reports (no payments yet).
--
-- Every profile carries a remaining-runs counter (default 0: visible button,
-- server-side denial, zero cost) plus an owner/admin flag meaning unlimited.
-- The two functions are the only ways the number changes and they are
-- service_role only, so clients can never mint or spend allowance themselves;
-- RLS already limits reads to the owner (profiles_select_own), and the
-- column-level update grant (display_name only) keeps these columns
-- backend-owned. A future Stripe webhook adds credits through
-- grant_full_report_credits, so none of this is throwaway.

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists full_report_credits integer not null default 0
    constraint profiles_credits_nonnegative check (full_report_credits >= 0);

comment on column public.profiles.is_admin is
  'Owner/admin: unlimited full reports, never decremented.';
comment on column public.profiles.full_report_credits is
  'Remaining full-report runs; spent atomically per accepted run.';

-- Atomic spend: true when a credit was available and consumed, null/false
-- when the balance was already zero (no race can double-spend).
create or replace function public.consume_full_report_credit(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set full_report_credits = full_report_credits - 1
   where id = p_user_id
     and full_report_credits >= 1
  returning true;
$$;

-- Atomic grant (also the refund path when an accepted run fails, and the
-- future Stripe fulfillment primitive). Returns the new balance.
create or replace function public.grant_full_report_credits(p_user_id uuid, p_count integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set full_report_credits = full_report_credits + greatest(p_count, 0)
   where id = p_user_id
  returning full_report_credits;
$$;

revoke execute on function public.consume_full_report_credit(uuid)
  from public, anon, authenticated;
revoke execute on function public.grant_full_report_credits(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.consume_full_report_credit(uuid) to service_role;
grant execute on function public.grant_full_report_credits(uuid, integer) to service_role;
