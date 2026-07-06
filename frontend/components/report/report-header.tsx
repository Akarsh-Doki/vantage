import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { ReportMeta } from "@/lib/report-types"

/*
 * Public sample-report header. No Export/Approve here — those belong to the
 * authenticated report view; this page's job is to convert readers, so the
 * action area carries a "Sample report" badge and one primary CTA.
 */
export function ReportHeader({ meta }: { meta: ReportMeta }) {
  return (
    <header className="border-b border-hairline">
      {/* Action bar — hidden when printing (see @media print in globals.css) */}
      <div className="report-action-bar mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="h-4 w-px bg-hairline" aria-hidden />
          <Link href="/" className="font-serif text-lg font-medium tracking-tight">
            Vantage
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center rounded-full border border-forest/25 bg-forest/5 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-forest sm:inline-flex">
            Sample report
          </span>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-[10px] bg-forest px-4 py-2 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
          >
            Run this on your business
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Title block */}
      <div className="mx-auto max-w-[760px] px-6 pb-16 pt-12">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-forest">Marketing Report</p>
          <span className="inline-flex items-center rounded-full border border-forest/25 bg-forest/5 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-forest sm:hidden">
            Sample
          </span>
        </div>
        <h1 className="mt-4 text-balance font-serif text-4xl font-medium leading-[1.08] tracking-tight md:text-6xl">
          {meta.business}
        </h1>
        <p className="mt-5 max-w-[620px] text-pretty text-lg leading-relaxed text-muted-foreground">
          {meta.descriptor}
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {meta.chips.map((chip) => (
            <div
              key={chip.label}
              className="flex items-center gap-2 rounded-[10px] border border-hairline bg-white px-3 py-1.5"
            >
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {chip.label}
              </span>
              <span className="text-sm font-medium">{chip.value}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
