import Link from "next/link"
import { ArrowRight } from "lucide-react"

/*
 * Shown after the last section of a FREE SAMPLE report. The sample is a
 * smaller but complete deliverable (competitive read plus one scored
 * concept). This band frames the full report as the next step, never the
 * sample as incomplete. Hidden when printing, like the other action chrome.
 */
export function SampleUpsell() {
  return (
    <section className="report-action-bar border-t border-hairline bg-tan/25">
      <div className="mx-auto max-w-[760px] px-6 py-16 text-center md:py-20">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-forest">
          Free sample
        </p>
        <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
          The full report goes deeper
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] text-pretty leading-relaxed text-muted-foreground">
          This sample is a competitive read and one scored concept, built from live competitor
          research. Run the full report for audience research, market and trend analysis, a
          complete strategy, three scored concepts, and a review pass on everything.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/new"
            className="inline-flex items-center gap-2 rounded-[10px] bg-forest px-6 py-3 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
          >
            Run the full report
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 rounded-[10px] border border-hairline bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  )
}
