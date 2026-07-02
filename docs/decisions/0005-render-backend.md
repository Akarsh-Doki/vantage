# ADR 0005: Render for the backend and fetcher

**Status:** Accepted · 2026-07-02

## Decision

The FastAPI backend and the Go fetcher run as long-lived services on Render. The frontend stays on Vercel.

## Why

- A report run is a multi-minute stateful process with SSE progress streaming. That needs a long-running server, which rules out serverless function hosting as the primary runtime.
- Render gives us exactly what we need with near-zero ops: git-push deploys, managed TLS, health checks, env-var secrets (CLAUDE.md rule 2), and **private services** — the fetcher runs unexposed to the internet, callable only by the backend, which is a load-bearing part of the SSRF design (threat-model.md).
- Both services (Python + Go) deploy the same way on one platform — one mental model, one dashboard, one bill.
- Nothing Render-specific leaks into the code (it runs Docker/standard buildpacks), so migrating to Fly/Railway/AWS later is a config exercise, not a rewrite.

## Rejected

- **Vercel for the backend too** — serverless functions cap execution time well below a report run; no long-lived processes, awkward SSE. Vercel is kept where it excels: the static/React frontend.
- **AWS (ECS/Lambda)** — maximum control, maximum ops burden (VPC, IAM, deploy pipeline). Wrong trade for a solo build; revisit at real scale.
- **Fly.io** — comparable and credible, but more infra-flavored (Machines, WireGuard networking) with less turnkey DX; Render's private services + simplicity win for v1.
- **Railway** — similar DX, but weaker track record for production reliability and pricing predictability at the time of decision.
