import { CheckCircle2, MessageCircleQuestion, Radio } from "lucide-react"
import type { Audience } from "@/lib/report-types"
import { countWord } from "@/lib/utils"
import { CitedText, Cite } from "./citation"
import { SegmentChart } from "./segment-chart"
import { SectionHeading } from "./section-heading"

export function AudienceSection({
  data,
  eyebrow = "03 / Audience & Segmentation",
}: {
  data: Audience
  eyebrow?: string
}) {
  const { persona } = data
  const segments = data.segments ?? []
  const hasSegments = segments.length > 0
  return (
    <div>
      <SectionHeading
        eyebrow={eyebrow}
        title="Who this is for"
        lede={hasSegments ? `${countWord(segments.length)} segments, sized by reach.` : undefined}
        agent="audience"
      />

      <div className={`grid grid-cols-1 gap-6 ${hasSegments && persona ? "lg:grid-cols-2" : ""}`}>
        {hasSegments ? (
          <div className="rounded-[10px] border border-hairline bg-white p-5 md:p-7">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Segment share of addressable audience
            </p>
            <div className="mt-4">
              <SegmentChart segments={segments} />
            </div>
            {data.cites && data.cites.length > 0 ? (
              <p className="mt-3 border-t border-hairline pt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Shares from
                {data.cites.map((n) => (
                  <Cite key={n} n={n} />
                ))}
              </p>
            ) : null}
          </div>
        ) : null}

        {persona ? (
          <div className="rounded-[10px] border border-forest/20 bg-white p-6 md:p-7">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-forest">Primary persona</p>
              <span className="font-mono text-xs text-muted-foreground">{persona.ageRange}</span>
            </div>
            <h3 className="mt-2 font-serif text-2xl font-medium tracking-tight">{persona.name}</h3>

            <div className="mt-5 space-y-4 text-sm leading-relaxed">
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-forest" /> Motivations
                </p>
                <ul className="space-y-1 text-foreground/90">
                  {persona.motivations.map((m) => (
                    <li key={m} className="border-l-2 border-tan pl-3">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <MessageCircleQuestion className="h-3.5 w-3.5 text-forest" /> Objections to answer
                </p>
                <ul className="space-y-1 text-foreground/90">
                  {persona.objections.map((o) => (
                    <li key={o} className="border-l-2 border-tan pl-3">
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Radio className="h-3.5 w-3.5 text-forest" /> Where she already is
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {persona.channels.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-tan px-2.5 py-0.5 font-mono text-[11px] font-medium text-forest"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {data.implication ? (
        <div className="mt-8 max-w-[760px] text-lg leading-relaxed text-foreground/90">
          <CitedText text={data.implication.text} cites={data.implication.cites} />
        </div>
      ) : null}
    </div>
  )
}
