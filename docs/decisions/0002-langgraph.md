# ADR 0002: LangGraph for agent orchestration

**Status:** Accepted · 2026-07-02

## Decision

The multi-agent pipeline (planner → parallel research → synthesis → human review gate → creative → reviewer loop) is built on LangGraph.

## Why

- The pipeline is literally a graph: fan-out to three research agents, a join at synthesis, a conditional reviewer→creative retry edge, and a human-in-the-loop pause. LangGraph models each of these natively instead of via hand-rolled state machines.
- Built-in checkpointing persists graph state to Postgres, giving us resumable runs (95% reliability target, PRD §3) and the `awaiting_review` pause without inventing our own persistence protocol.
- Native recursion/iteration limits map directly onto CLAUDE.md rule 7 (cap agent loops).
- Typed state (Pydantic-compatible) and node-level testability: each agent node is a function we can unit-test with a mocked LLM (rule 9).

## Rejected

- **Hand-rolled orchestration (plain asyncio)** — we'd reimplement checkpointing, retries, interrupts, and loop caps ourselves; that's undifferentiated infrastructure risk in the most critical part of the product.
- **LangChain agents/chains alone** — too implicit; an autonomous agent deciding its own control flow makes cost and behavior unpredictable. We want an explicit, bounded graph.
- **CrewAI / AutoGen** — role-play-style autonomy over explicit control flow; weaker human-in-the-loop and persistence stories; smaller ecosystems.
- **Temporal** — excellent durable execution, but a heavy operational dependency for a solo-built product; LangGraph checkpointing covers our durability needs at this scale.
