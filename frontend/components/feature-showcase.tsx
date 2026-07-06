import type { ReactNode } from "react"
import { ResearchVisual } from "@/components/visuals/research-visual"
import { PipelineVisual } from "@/components/visuals/pipeline-visual"
import { ConceptVisual } from "@/components/visuals/concept-visual"

type Row = {
  heading: string
  body: string
  visual: ReactNode
  visualLeft: boolean
}

const rows: Row[] = [
  {
    heading: "Live research, every claim cited.",
    body: "Vantage pulls real market signals as it works, not stale training data. Every finding links back to a source you can open and verify.",
    visual: <ResearchVisual />,
    visualLeft: true,
  },
  {
    heading: "A team of agents, not one prompt.",
    body: "Competitor, audience, and market agents run in parallel, then converge into a synthesis step that feeds strategy and creative. The result is a plan, not a guess.",
    visual: <PipelineVisual />,
    visualLeft: false,
  },
  {
    heading: "Concepts scored before you see them.",
    body: "Every campaign concept is drafted, graded, and refined by a review agent. You only review ideas that already cleared the bar.",
    visual: <ConceptVisual />,
    visualLeft: true,
  },
]

export function FeatureShowcase() {
  return (
    <section id="features" className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-forest">How it works</span>
          <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Watch Vantage build your campaign
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            A transparent pipeline you can follow step by step, from live research to a finished, graded concept.
          </p>
        </div>
        <div className="mt-16 space-y-16 sm:space-y-24">
          {rows.map((row) => (
            <div key={row.heading} className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <div className={row.visualLeft ? "md:order-1" : "md:order-2"}>{row.visual}</div>
              <div className={row.visualLeft ? "md:order-2" : "md:order-1"}>
                <h3 className="text-balance font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {row.heading}
                </h3>
                <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">{row.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
