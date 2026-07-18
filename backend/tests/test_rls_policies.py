"""SQL-level Row-Level-Security policy tests (integration tier).

These run the REAL migrations against a real Postgres and exercise the actual
policies as the `authenticated` and `anon` roles, the enforcement Supabase
applies in production. They are skipped unless TEST_DATABASE_URL is set, so
the default suite stays dependency-free. To run locally:

    docker run --rm -d --name vantage-rls -e POSTGRES_PASSWORD=postgres \
        -p 55432:5432 postgres:16-alpine
    TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres \
        .venv/bin/python -m pytest -m rls -q
    docker rm -f vantage-rls

The harness installs a tiny Supabase shim (auth schema, auth.users, an
auth.uid() that reads request.jwt.claims exactly like Supabase's, and the
anon/authenticated/service_role roles), then applies migrations 005 through
007 verbatim. Zero API spend, nothing here touches the network.
"""

import os
import uuid
from collections.abc import Iterator
from pathlib import Path

import pytest

pytestmark = [
    pytest.mark.rls,
    pytest.mark.skipif(
        not os.environ.get("TEST_DATABASE_URL"),
        reason="TEST_DATABASE_URL not set; see module docstring to run the RLS tier",
    ),
]

psycopg = pytest.importorskip("psycopg")

_MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"

# Just enough Supabase for the migrations and policies to be real: the roles,
# the auth schema, and an auth.uid() with Supabase's actual semantics (the
# `sub` claim of request.jwt.claims).
_SUPABASE_SHIM = """
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email text
);
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid
$$;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
"""

USER_A = str(uuid.uuid4())
USER_B = str(uuid.uuid4())


@pytest.fixture(scope="module")
def db() -> Iterator["psycopg.Connection"]:
    """A superuser connection with the shim + real migrations applied to a
    fresh schema, seeded with one project/run/report per user."""
    conn = psycopg.connect(os.environ["TEST_DATABASE_URL"], autocommit=True)
    with conn.cursor() as cur:
        # Fresh slate so the module is rerunnable against a warm container.
        cur.execute("drop schema if exists public cascade; create schema public;")
        cur.execute("drop schema if exists auth cascade;")
        cur.execute(_SUPABASE_SHIM)
        cur.execute((_MIGRATIONS / "005_app_tables.sql").read_text(encoding="utf-8"))
        cur.execute((_MIGRATIONS / "006_run_display_name.sql").read_text(encoding="utf-8"))
        cur.execute((_MIGRATIONS / "007_full_report_credits.sql").read_text(encoding="utf-8"))
        # Seed both users. The signup trigger creates their profiles rows.
        for user_id, email in ((USER_A, "a@test.example"), (USER_B, "b@test.example")):
            cur.execute("insert into auth.users (id, email) values (%s, %s)", (user_id, email))
            cur.execute(
                """
                insert into public.projects (id, user_id, business_name, business_description,
                                             website_url)
                values (%s, %s, 'Acme', '', 'https://acme.example')
                """,
                (user_id, user_id),  # project id reuses the user uuid for simplicity
            )
            cur.execute(
                """
                insert into public.report_runs (id, user_id, project_id, kind, status)
                values (%s, %s, %s, 'full', 'completed')
                """,
                (user_id, user_id, user_id),  # run id likewise
            )
            cur.execute(
                """
                insert into public.reports (user_id, project_id, run_id, kind, brief)
                values (%s, %s, %s, 'full', '{}'::jsonb)
                """,
                (user_id, user_id, user_id),
            )
    yield conn
    conn.close()


@pytest.fixture
def as_user(db: "psycopg.Connection"):
    """Run SQL the way Supabase serves a signed-in client, as the
    `authenticated` role with the user's id in request.jwt.claims."""

    def _run(user_id: str, sql: str, params: tuple = ()) -> list[tuple]:
        with db.cursor() as cur:
            cur.execute("begin")
            try:
                cur.execute("set local role authenticated")
                cur.execute(
                    "select set_config('request.jwt.claims', %s, true)",
                    (f'{{"sub": "{user_id}"}}',),
                )
                cur.execute(sql, params)
                return cur.fetchall() if cur.description else [(cur.rowcount,)]
            finally:
                cur.execute("rollback")

    return _run


def test_users_see_only_their_own_rows(as_user) -> None:
    for table in ("projects", "report_runs", "reports", "profiles"):
        rows = as_user(USER_A, f"select * from public.{table}")  # noqa: S608 (fixed table names)
        assert len(rows) == 1, f"{table}: expected exactly the user's own row"


def test_cross_user_writes_touch_zero_rows(as_user) -> None:
    # RLS filters rather than errors. A hostile soft-delete against another
    # user's report succeeds as a statement but affects zero rows.
    affected = as_user(
        USER_A, "update public.reports set deleted_at = now() where run_id = %s", (USER_B,)
    )
    assert affected == [(0,)]


def test_report_runs_are_read_only_for_clients(as_user) -> None:
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        as_user(USER_A, "update public.report_runs set display_name = 'x' where id = %s", (USER_A,))
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        as_user(
            USER_A,
            "insert into public.report_runs (user_id, project_id, kind, status)"
            " values (%s, %s, 'full', 'queued')",
            (USER_A, USER_A),
        )


def test_soft_deleted_reports_vanish_from_reads(db, as_user) -> None:
    # Documented Postgres behavior this suite CAUGHT. A client cannot soft
    # delete their own report, because setting deleted_at makes the NEW row
    # fail the select policy's "deleted_at is null" and Postgres requires an
    # updated row to stay readable when the statement reads the table. The
    # app is unaffected (deletes go through the backend's service role, which
    # bypasses RLS). The client-side soft-delete grant is effectively dead.
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        as_user(USER_A, "update public.reports set deleted_at = now() where run_id = %s", (USER_A,))

    # The real path. The backend (service role semantics, superuser here)
    # soft deletes, and the row vanishes from the owner's reads.
    with db.cursor() as cur:
        cur.execute("update public.reports set deleted_at = now() where run_id = %s", (USER_A,))
    try:
        rows = as_user(USER_A, "select * from public.reports")
        assert rows == []  # reports_select_own hides soft-deleted rows
    finally:
        with db.cursor() as cur:
            cur.execute("update public.reports set deleted_at = null where run_id = %s", (USER_A,))


def test_profile_plan_column_is_backend_owned(as_user) -> None:
    # display_name is granted. plan and free_sample_used are not.
    affected = as_user(
        USER_A, "update public.profiles set display_name = 'Me' where id = %s", (USER_A,)
    )
    assert affected == [(1,)]
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        as_user(USER_A, "update public.profiles set plan = 'paid' where id = %s", (USER_A,))


def test_clients_cannot_touch_the_full_report_allowance(as_user) -> None:
    # The cost-control columns are backend-owned. A signed-in client can read
    # their own balance (profiles_select_own) but can never change it.
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        as_user(
            USER_A, "update public.profiles set full_report_credits = 999 where id = %s", (USER_A,)
        )
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        as_user(USER_A, "update public.profiles set is_admin = true where id = %s", (USER_A,))
    # Nor mint or spend allowance through the RPCs. They are service_role only.
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        as_user(USER_A, "select public.grant_full_report_credits(%s, 100)", (USER_A,))
    with pytest.raises(psycopg.errors.InsufficientPrivilege):
        as_user(USER_A, "select public.consume_full_report_credit(%s)", (USER_A,))


def test_credit_rpcs_spend_and_grant_atomically(db) -> None:
    # Exercise the real SQL functions as the backend does (service role
    # semantics, superuser here): grant 2, spend to zero, then the spend
    # correctly reports no credit left and the balance never goes negative.
    with db.cursor() as cur:
        cur.execute("select public.grant_full_report_credits(%s, 2)", (USER_A,))
        assert cur.fetchone()[0] == 2
        cur.execute("select public.consume_full_report_credit(%s)", (USER_A,))
        assert cur.fetchone()[0] is True
        cur.execute("select public.consume_full_report_credit(%s)", (USER_A,))
        assert cur.fetchone()[0] is True
        cur.execute("select public.consume_full_report_credit(%s)", (USER_A,))
        assert cur.fetchone()[0] is not True  # empty, no row updated
        cur.execute("select full_report_credits from public.profiles where id = %s", (USER_A,))
        assert cur.fetchone()[0] == 0


def test_anon_role_reads_nothing(db) -> None:
    with db.cursor() as cur:
        cur.execute("begin")
        try:
            cur.execute("set local role anon")
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                cur.execute("select * from public.reports")
        finally:
            cur.execute("rollback")
