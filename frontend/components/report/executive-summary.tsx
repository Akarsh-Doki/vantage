import type { ExecutiveSummary as ExecutiveSummaryData } from "@/lib/report-types"
import { CitedText } from "./citation"
import { SectionHeading } from "./section-heading"

export function ExecutiveSummary({
  data,
  eyebrow = "01 / Executive Summary",
}: {
  data: ExecutiveSummaryData
  eyebrow?: string
}) {
  return (
    <div>
      <SectionHeading eyebrow={eyebrow} title="The read on your market" agent="strategy" />
      <div className="rounded-[10px] border border-hairline bg-white p-7 md:p-10">
        <div className="space-y-5 text-lg leading-relaxed text-foreground/90">
          {data.paragraphs.map((p) => (
            <CitedText key={p.text.slice(0, 32)} text={p.text} cites={p.cites} />
          ))}
        </div>
      </div>
      {data.tiles && data.tiles.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.tiles.map((tile) => (
            <div key={tile.label} className="rounded-[10px] border border-hairline bg-white p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{tile.label}</p>
              <p className="mt-2 font-mono text-xl font-semibold tracking-tight text-forest">{tile.value}</p>
              <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{tile.detail}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
