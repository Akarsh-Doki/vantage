import { ArrowUpRight } from "lucide-react"
import type { CreativeConcept, Source } from "@/lib/report-types"
import { SectionHeading } from "./section-heading"

export function CreativeConcepts({ concepts, sources }: { concepts: CreativeConcept[]; sources: Source[] }) {
  return (
    <div>
      <SectionHeading
        eyebrow="06 / Creative Concepts"
        title="Three campaigns you could start Monday"
        lede="Each concept is built on a proven mechanism from the Vantage creative library, scored against your positioning, and grounded in a cited source."
      />
      <div className="space-y-6">
        {concepts.map((c, idx) => {
          const source = sources[c.sourceIndex]
          return (
            <article key={c.title} className="relative rounded-[10px] border border-hairline bg-white p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-[6px] bg-tan px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-forest">
                      {c.mechanism}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">{c.mechanismId}</span>
                  </div>
                  <h3 className="mt-3 font-serif text-2xl font-medium tracking-tight">
                    {String(idx + 1).padStart(2, "0")} · {c.title}
                  </h3>
                </div>
                <span className="shrink-0 rounded-full border border-forest/20 bg-forest/5 px-3 py-1 font-mono text-sm font-semibold text-forest">
                  {c.score}
                </span>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">The idea</p>
                  <p className="mt-1.5 leading-relaxed text-foreground/90">{c.idea}</p>
                </div>

                <div className="rounded-[10px] border border-hairline bg-secondary/50 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Execution &middot; first post
                  </p>
                  <p className="mt-1.5 leading-relaxed text-foreground/90">{c.execution}</p>
                </div>

                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Why you can own it
                  </p>
                  <p className="mt-1.5 leading-relaxed text-foreground/90">{c.own}</p>
                </div>

                {c.calendar ? (
                  <div className="overflow-x-auto rounded-[10px] border border-hairline">
                    <p className="border-b border-hairline bg-secondary/40 px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-forest">
                      First 30 days · content calendar
                    </p>
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-hairline">
                          <th className="px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Week
                          </th>
                          <th className="px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Format
                          </th>
                          <th className="px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Hook
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {c.calendar.map((row) => (
                          <tr key={row.week} className="align-top">
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-forest">{row.week}</td>
                            <td className="px-4 py-3 text-foreground/80">{row.format}</td>
                            <td className="px-4 py-3 text-foreground/90">&ldquo;{row.hook}&rdquo;</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-hairline pt-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Grounded in:
                </span>
                <a
                  href={`#source-${String(c.sourceIndex + 1)}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline"
                >
                  {source ? source.title : "Sources"}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
