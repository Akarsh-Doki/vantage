import type { CompetitiveLandscape as LandscapeData } from "@/lib/report-types"
import { CitedText, Cite } from "./citation"
import { PositioningScatter } from "./positioning-scatter"
import { SectionHeading } from "./section-heading"

export function CompetitiveLandscape({
  data,
  eyebrow = "02 / Market & Competitive Landscape",
}: {
  data: LandscapeData
  eyebrow?: string
}) {
  const hasAnalysis = Boolean(data.analysis && data.analysis.length > 0)
  const hasMap = Boolean(data.points && data.points.length > 0 && data.xLabel && data.yLabel)
  return (
    <div>
      <SectionHeading
        eyebrow={eyebrow}
        title="Where the category leaves room"
        lede={data.lede}
        agent="research"
      />

      <div
        className={`grid grid-cols-1 gap-6 ${hasMap && hasAnalysis ? "lg:grid-cols-5 lg:items-start" : ""}`}
      >
        {hasMap ? (
          <div
            className={`rounded-[10px] border border-hairline bg-white p-5 md:p-7 ${
              hasAnalysis ? "lg:col-span-3" : "mx-auto w-full max-w-[760px]"
            }`}
          >
            <PositioningScatter
              points={data.points ?? []}
              xLabel={data.xLabel ?? ""}
              yLabel={data.yLabel ?? ""}
              highlight={data.highlight}
            />
            {data.cites && data.cites.length > 0 ? (
              <p className="mt-3 border-t border-hairline pt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Placement grounded in
                {data.cites.map((n) => (
                  <Cite key={n} n={n} />
                ))}
              </p>
            ) : null}
          </div>
        ) : null}
        {hasAnalysis ? (
          <div
            className={`space-y-5 text-base leading-relaxed text-foreground/90 ${
              hasMap ? "lg:col-span-2 lg:pt-2" : "max-w-[760px] text-lg"
            }`}
          >
            {(data.analysis ?? []).map((a) => (
              <CitedText key={a.text.slice(0, 32)} text={a.text} cites={a.cites} />
            ))}
          </div>
        ) : null}
      </div>

      {data.table && data.table.length > 0 ? (
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
      ) : null}
    </div>
  )
}
