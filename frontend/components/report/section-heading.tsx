import { AgentByline, type AgentId } from "./agent-byline"

/*
 * The report's section-header pattern: mono eyebrow, serif title, optional
 * lede, then one structural accent applied everywhere, a baseline hairline
 * rule with a short forest tick, with the contributor credential seated on
 * the rule's right end. Quiet craft; the content below stays the product.
 */

/** The shared baseline rule: full hairline with a short forest tick at left. */
export function SectionRule() {
  return (
    <span aria-hidden className="relative h-px min-w-8 flex-1 bg-hairline">
      <span className="absolute left-0 top-0 h-px w-12 bg-forest" />
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  agent,
}: {
  eyebrow: string
  title: string
  lede?: string
  /** credits the specialist agent that produced the section */
  agent?: AgentId
}) {
  return (
    <div className="mb-10">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-forest">{eyebrow}</p>
      <h2 className="mt-3.5 text-balance font-serif text-3xl font-medium tracking-tight md:text-4xl">
        {title}
      </h2>
      {lede ? (
        <p className="mt-4 max-w-[640px] text-pretty text-lg leading-relaxed text-muted-foreground">{lede}</p>
      ) : null}
      <div className="mt-7 flex items-center gap-5">
        <SectionRule />
        {agent ? <AgentByline agent={agent} /> : null}
      </div>
    </div>
  )
}
