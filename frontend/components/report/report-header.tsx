import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import type { ReportMeta } from "@/lib/report-types"

/*
 * Report header shared by the public sample and the authenticated report view.
 * The pages differ only in the action area: the sample carries a conversion
 * CTA, the real report carries Export. Both come in through `actions`.
 */
export function ReportHeader({
  meta,
  badge,
  backHref = "/",
  actions,
}: {
  meta: ReportMeta
  /** small status chip, e.g. "Sample report" or "Full report" */
  badge?: string
  backHref?: string
  actions?: ReactNode
}) {
  return (
    <header className="border-b border-hairline">
      {/* Action bar, hidden when printing (see @media print in globals.css) */}
      <div className="report-action-bar mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
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
          {badge ? (
            <span className="hidden items-center rounded-full border border-forest/25 bg-forest/5 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-forest sm:inline-flex">
              {badge}
            </span>
          ) : null}
          {actions}
        </div>
      </div>

      {/* Title block */}
      <div className="mx-auto max-w-[760px] px-6 pb-16 pt-12">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-forest">Marketing Report</p>
          {badge ? (
            <span className="inline-flex items-center rounded-full border border-forest/25 bg-forest/5 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-forest sm:hidden">
              {badge}
            </span>
          ) : null}
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
