import type { ExecutiveSummary as ExecutiveSummaryData } from "@/lib/report-types"
import { SectionHeading } from "./section-heading"

export function ExecutiveSummary({ data }: { data: ExecutiveSummaryData }) {
  return (
    <div>
      <SectionHeading eyebrow="01 / Executive Summary" title="The read on your market" />
      <div className="rounded-[10px] border border-hairline bg-white p-7 md:p-10">
        <div className="space-y-5 text-lg leading-relaxed text-foreground/90">
          {data.paragraphs.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.tiles.map((tile) => (
          <div key={tile.label} className="rounded-[10px] border border-hairline bg-white p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{tile.label}</p>
            <p className="mt-2 font-mono text-xl font-semibold tracking-tight text-forest">{tile.value}</p>
            <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{tile.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
