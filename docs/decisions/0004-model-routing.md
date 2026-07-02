# ADR 0004: Claude Haiku for research, Sonnet for synthesis/creative

**Status:** Accepted · 2026-07-02

## Decision

Model routing by pipeline stage: **Haiku** for the planner and the three research agents; **Sonnet** for synthesis, the creative director, and the reviewer. Model choice is per-node config, not hardcoded in agents.

## Why

- Cost is the #1 constraint (PRD §9) and token volume is wildly asymmetric: research agents chew through fetched pages and search results (high input volume, mechanical extract-and-cite work), while synthesis/creative are low-volume but quality-defining. Routing puts ~80% of tokens on the cheap model.
- Research tasks — summarize a page, extract claims with sources, plan lookups — are well within Haiku's capability; report quality is decided at synthesis (positioning-gap analysis) and creative (the actual product), where Sonnet's judgment earns its price.
- The reviewer runs on Sonnet because a weak judge rubber-stamps weak ideas; the quality filter is a core moat (PRD §11) and is only as good as its scorer.
- Per-node routing keeps us flexible: if evals show a research step failing, upgrade that one node; if Sonnet prices drop or Haiku improves, shift the boundary — no code changes, config only.

## Rejected

- **Sonnet everywhere** — 3–5× the per-run cost for no measurable gain on extraction-shaped research work; breaks the low-cost positioning.
- **Haiku everywhere** — synthesis and creative are the product; saving cents there to ship generic output destroys the only reason Vantage beats a plain chatbot.
- **Opus for creative** — revisit if evals show a quality gap Sonnet can't close; not justified at current price/quality for v1.
- **Multi-vendor routing (e.g. GPT/Gemini mix)** — two SDKs, two failure modes, two prompt dialects to maintain, for marginal benefit; single-vendor with per-node model choice keeps ops simple.
