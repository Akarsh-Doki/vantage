import type { Kpi } from "@/lib/report-types"
import { countWord } from "@/lib/utils"
import { SectionHeading } from "./section-heading"

export function Measurement({ kpis, eyebrow = "07 / Measurement" }: { kpis: Kpi[]; eyebrow?: string }) {
  return (
    <div>
      <SectionHeading
        eyebrow={eyebrow}
        title="What we'll track"
        lede={`${countWord(kpis.length)} numbers, checked weekly.`}
        agent="strategy"
      />
      <div className="overflow-x-auto rounded-[10px] border border-hairline bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline">
              <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                KPI
              </th>
              <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Q1 target
              </th>
              <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Context
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {kpis.map((kpi) => (
              <tr key={kpi.metric} className="align-top">
                <td className="px-5 py-4 font-medium">{kpi.metric}</td>
                <td className="px-5 py-4 font-mono text-sm font-semibold tabular-nums text-forest">{kpi.target}</td>
                <td className="px-5 py-4 text-foreground/80">{kpi.benchmark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
