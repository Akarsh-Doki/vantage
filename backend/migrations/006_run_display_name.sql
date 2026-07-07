-- 006: user-facing rename for report runs.
--
-- display_name is the only run field a user can change. Writes go through the
-- authenticated API (PATCH /reports/{id}), which is owner-scoped in code; RLS
-- remains the backstop: report_runs has row-level security enabled with an
-- owner-scoped select policy (005), and clients hold no update grant on this
-- table, so nothing client-side can write it directly.

alter table public.report_runs
  add column if not exists display_name text
    constraint report_runs_display_name_length
    check (display_name is null or char_length(display_name) between 1 and 120);

comment on column public.report_runs.display_name is
  'User-chosen report name; null falls back to the project business name.';
