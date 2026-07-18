import { ArrowUpRight } from "lucide-react"
import type { CreativeConcept, Source } from "@/lib/report-types"
import { countWord } from "@/lib/utils"
import { SectionHeading } from "./section-heading"

function sectionTitle(count: number): string {
  return count === 1
    ? "One campaign you could start Monday"
    : `${countWord(count)} campaigns you could start Monday`
}

export function CreativeConcepts({
  concepts,
  sources,
  eyebrow = "06 / Creative Concepts",
}: {
  concepts: CreativeConcept[]
  sources: Source[]
  eyebrow?: string
}) {
  return (
    <div>
      <SectionHeading
        eyebrow={eyebrow}
        title={sectionTitle(concepts.length)}
        lede="Each one is built on a mechanism from the Vantage pattern library and was scored before it reached this page."
        agent="creative"
      />
      <div className="space-y-6">
        {concepts.map((c, idx) => {
          const source = c.sourceIndex !== undefined ? sources[c.sourceIndex] : undefined
          return (
            <article key={c.title} className="relative rounded-[10px] border border-hairline bg-white p-6 md:p-8">
              {/* The raw rubric score is intentionally not rendered. It is
                  review machinery, and a topped-up concept's number would
                  read as a grade. The section lede already says every concept
                  was scored before it reached the page. */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-[6px] bg-tan px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-forest">
                    {c.mechanism}
                  </span>
                  {c.mechanismId ? (
                    <span className="font-mono text-[11px] text-muted-foreground">{c.mechanismId}</span>
                  ) : null}
                  {c.format ? (
                    <span className="inline-flex items-center rounded-[6px] border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {c.format}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 font-serif text-2xl font-medium tracking-tight">
                  {String(idx + 1).padStart(2, "0")} · {c.title}
                </h3>
              </div>

              <div className="mt-5 space-y-5">
                {c.idea ? (
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">The idea</p>
                    <p className="mt-1.5 leading-relaxed text-foreground/90">{c.idea}</p>
                  </div>
                ) : null}

                {c.execution ? (
                  <div className="rounded-[10px] border border-hairline bg-secondary/50 p-4">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Execution &middot; first post
                    </p>
                    <p className="mt-1.5 whitespace-pre-line leading-relaxed text-foreground/90">{c.execution}</p>
                  </div>
                ) : null}

                {c.own ? (
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Why you can own it
                    </p>
                    <p className="mt-1.5 leading-relaxed text-foreground/90">{c.own}</p>
                  </div>
                ) : null}

                {c.budgetFit ? (
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Budget fit</p>
                    <p className="mt-1.5 leading-relaxed text-foreground/90">{c.budgetFit}</p>
                  </div>
                ) : null}

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
                  href={source && c.sourceIndex !== undefined ? `#source-${String(c.sourceIndex + 1)}` : "#sources"}
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
