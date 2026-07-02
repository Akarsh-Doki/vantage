# ADR 0003: Supabase for database, auth, and vectors

**Status:** Accepted · 2026-07-02

## Decision

Supabase provides Postgres (app data), pgvector (creative-pattern library embeddings), Auth (JWT), and Row-Level Security.

## Why

- One dependency replaces three: managed Postgres + auth + vector search. For a solo build, every service not operated is a week not lost.
- It's real Postgres — parameterized SQL, migrations, `CHECK` constraints, and a clean exit path (any Postgres host) if Supabase ever fails us. No proprietary data model lock-in.
- RLS is first-class and JWT-integrated: `auth.uid()` policies give database-enforced tenant isolation (CLAUDE.md rule 8) as a backstop behind application `WHERE user_id` scoping — two independent layers.
- pgvector keeps the creative library in the same database as everything else: one backup story, one connection pool, and joins between patterns and reports when we need them.
- Free tier → paid tier scales past our first-5-customers milestone without re-architecture.

## Rejected

- **Postgres (RDS/Neon) + Auth0/Clerk + Pinecone** — three vendors, three bills, three failure modes, and glue code between auth identities and DB rows that Supabase gives us natively.
- **Firebase** — NoSQL fits our relational data (projects→runs→reports) badly; security rules are weaker than RLS for SQL-shaped isolation; vector story immature.
- **Self-hosted Postgres on Render** — we'd own backups, upgrades, and auth integration; zero product value for the operational cost.
- **Dedicated vector DB (Pinecone/Qdrant)** — the creative library is small (hundreds of patterns); pgvector is more than sufficient and avoids a second data store.
