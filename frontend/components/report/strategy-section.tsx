import type { Strategy } from "@/lib/report-types"
import { ChannelChart } from "./channel-chart"
import { CitedText } from "./citation"
import { FunnelDiagram } from "./funnel-diagram"
import { SectionHeading } from "./section-heading"

export function StrategySection({ data }: { data: Strategy }) {
  return (
    <div>
      <SectionHeading
        eyebrow="05 / Strategy"
        title="How the subscription compounds"
        lede="A two-step growth motion: remove the commitment objection at trial, then use the first month to build a habit cancellation would break."
      />

      <div className="max-w-[760px] space-y-5 text-lg leading-relaxed text-foreground/90">
        {data.narrative.map((p) => (
          <CitedText key={p.text.slice(0, 32)} text={p.text} cites={p.cites} />
        ))}
      </div>

      <figure className="my-10 max-w-[760px] border-l-2 border-forest pl-6">
        <blockquote className="font-serif text-2xl font-medium leading-snug tracking-tight text-foreground md:text-3xl">
          &ldquo;{data.pullQuote}&rdquo;
        </blockquote>
        <figcaption className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {data.pullQuoteCaption}
        </figcaption>
      </figure>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[10px] border border-hairline bg-white p-5 md:p-7">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Channel priority · recommended weight of effort
          </p>
          <div className="mt-4">
            <ChannelChart channels={data.channels} />
          </div>
        </div>
        <div className="rounded-[10px] border border-hairline bg-white p-5 md:p-7">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            The retention funnel this strategy is built around
          </p>
          <div className="mt-5">
            <FunnelDiagram stages={data.funnel} />
          </div>
          <p className="mt-5 border-t border-hairline pt-4 text-sm leading-relaxed text-muted-foreground">
            Most churn happens before the fourth bag. Every channel and concept in this report is pointed at the
            middle of this funnel, not the top.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.pillars.map((pillar, i) => (
          <div key={pillar.title} className="rounded-[10px] border border-hairline bg-white p-6">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-forest">
              Pillar {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 font-serif text-xl font-medium tracking-tight">{pillar.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
