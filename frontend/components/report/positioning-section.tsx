import type { Positioning } from "@/lib/report-types"
import { AgentByline } from "./agent-byline"
import { CitedText } from "./citation"
import { SectionRule } from "./section-heading"

/*
 * This section has no serif title on purpose (the statement is the title),
 * but it keeps the shared header structure: eyebrow, then the baseline rule
 * with the contributor credential seated on it.
 */
export function PositioningSection({ data, number = "04" }: { data: Positioning; number?: string }) {
  return (
    <div>
      <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-forest">
        {number} / Positioning
      </p>
      <div className="mb-9 mt-6 flex items-center gap-5">
        <SectionRule />
        <AgentByline agent="strategy" />
      </div>

      <figure className="relative overflow-hidden rounded-[10px] border border-forest/25 bg-white p-8 md:p-12">
        <span className="absolute inset-y-0 left-0 w-1 bg-forest" aria-hidden />
        <blockquote className="text-balance font-serif text-2xl font-medium leading-snug tracking-tight text-foreground md:text-[2rem]">
          {data.statement}
        </blockquote>
        <figcaption className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-forest">
          {data.tagline}
        </figcaption>
      </figure>

      <div className="mt-8 space-y-5 text-lg leading-relaxed text-foreground/90">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Why this, why now</h3>
        {data.whyNow.map((p) => (
          <CitedText key={p.text.slice(0, 32)} text={p.text} cites={p.cites} />
        ))}
      </div>
    </div>
  )
}
