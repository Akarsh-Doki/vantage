# Evaluation

How Vantage guards **output quality** against regressions — distinct from the
pytest suite, which tests code correctness. The harness lives in
[backend/evals/](../backend/evals/): it runs the real agent pipeline over a
curated dataset ([dataset.json](../backend/evals/dataset.json)) of small
businesses spanning varied types, goals, and budgets, and scores each run on
four metrics. Run it with `make eval` (or `make eval ARGS="--dry-run"` for a
$0 dry run); results are written to `backend/evals/results/`.

## The four metrics

### Groundedness (computed)
The fraction of creative concepts whose `grounded_in` source URL actually
appears in the run's research findings. **Why it matters:** cited evidence is
the product's moat and a hard rule — every claim must trace to a real source
found during the run (CLAUDE.md rule 10). A concept citing a source that was
never retrieved is fabricated, and this metric catches it deterministically
(no LLM judgment involved).

### Relevance (LLM-graded, 1–5)
One `call_model(SONNET, ...)` judge call scores each item's concepts against
the dataset's `expectations` for that business. **Why it matters:** groundedness
proves a concept is *sourced*, not that it's *good*. Relevance measures whether
the campaign actually addresses what a good answer for that business, goal, and
budget should — the quality signal a human would care about.

### Cost (¢ per run)
Model/search/fetch spend accumulated into the run via the usage ledger. **Why
it matters:** runaway cost is a bug (rule 7). Tracking per-item cost keeps the
economics honest — the cheap-model-for-research / strong-model-for-synthesis
split only pays off if we measure it, and it catches a prompt change that
silently doubles spend.

### Latency (wall-clock seconds)
Time for the graph run per item. **Why it matters:** it's the user-facing wait.
Latency guards against a change that improves quality but makes a run
unacceptably slow.

## Measured results

A representative sample, not an exhaustive run — **12 items in sample mode plus
4 in full mode**. Sample mode is the cheap preview (competitor research only,
Haiku throughout, one concept); full mode is the complete pipeline.

| Metric | Sample (12 items) | Full (4 items) |
|---|---|---|
| **Groundedness** | 1.00 | 1.00 |
| **Relevance** (1–5) | ~2.75–3.33 avg | ~2.75–3.33 avg |
| **Cost** | ~1–2¢/item | ~40¢/item |
| **Latency** | seconds/item (sample is markedly faster; full runs the full agent chain + reviewer loop) | |

**Groundedness met its target: 1.00 across every evaluated item** — every
delivered concept cited a source that was actually found during its run. This
is the core "every claim is sourced" guarantee, and it held on the whole
sample.

Relevance averaging ~2.75–3.33 out of 5 is the honest current state: concepts
are grounded and on-topic but have room to improve in specificity and
punch — the expected next lever is creative-prompt and mechanism-retrieval
tuning, re-measured against this same harness.

Cost tracks the mode split as intended (~1–2¢ sample vs ~40¢ full), confirming
sample mode is the ~10x-cheaper iteration path. Latency was noted per run;
sample mode is markedly faster than full, which runs all three research agents,
synthesis, strategy, creative, and the reviewer loop.

## Honesty note

These numbers are from a **representative sample (16 runs total), not an
exhaustive evaluation** of the whole dataset in both modes. They establish a
baseline, not a guarantee across all inputs.

## How this guards against regressions

The harness turns quality into numbers you can watch. Groundedness is the
non-negotiable gate — a drop below 1.00 means a concept cited an unfound
source, a moat-breaking regression to block. Relevance is the improvement
target to move up without regressing. Cost and latency are guardrails: a change
that helps quality but blows up spend or wait time shows here before it ships.
Re-running `make eval` after a pipeline change compares against this baseline,
so a regression is visible in the metrics rather than discovered in production.
