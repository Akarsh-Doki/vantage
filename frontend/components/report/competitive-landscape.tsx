import type { CompetitiveLandscape as LandscapeData } from "@/lib/report-types"
import { CitedText } from "./citation"
import { PositioningScatter } from "./positioning-scatter"
import { SectionHeading } from "./section-heading"

export function CompetitiveLandscape({ data }: { data: LandscapeData }) {
  return (
    <div>
      <SectionHeading
        eyebrow="02 / Market &amp; Competitive Landscape"
        title="Where the category leaves room"
        lede="Five competitors mapped on the two axes buyers actually trade off — what they pay, and how fresh the coffee that arrives really is."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
        <div className="rounded-[10px] border border-hairline bg-white p-5 md:p-7 lg:col-span-3">
          <PositioningScatter points={data.points} />
        </div>
        <div className="space-y-5 text-base leading-relaxed text-foreground/90 lg:col-span-2 lg:pt-2">
          {data.analysis.map((a) => (
            <CitedText key={a.text.slice(0, 32)} text={a.text} cites={a.cites} />
          ))}
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-[10px] border border-hairline bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-hairline">
              <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Competitor
              </th>
              <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Positioning angle
              </th>
              <th className="px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Exploitable weakness
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {data.table.map((row) => (
              <tr key={row.name} className="align-top">
                <td className="px-5 py-4 font-medium">{row.name}</td>
                <td className="px-5 py-4 text-foreground/80">{row.angle}</td>
                <td className="px-5 py-4 text-foreground/80">{row.weakness}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
