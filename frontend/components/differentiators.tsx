import Link from "next/link"
import { ArrowRight, ArrowUpRight, BookMarked, FileDown, Library, RefreshCw } from "lucide-react"

const sourceChips = ["recharge.com", "sca.coffee", "mintel.com"]

export function Differentiators() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-wider text-forest">Why it&apos;s different</span>
        <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Not another chatbot wrapper
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          Most AI marketing tools hand you a chat window and call it strategy. Vantage runs a
          multi-agent pipeline that shows its work at every step, so what you get is evidence, not vibes.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-12">
        {/* 01 · Featured: the moat. Wider, forest rail, live source chips. */}
        <article className="relative overflow-hidden rounded-[10px] border border-hairline bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:col-span-12 md:p-7 lg:col-span-7">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-forest" aria-hidden />
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-forest text-forest-foreground">
              <BookMarked className="h-5 w-5" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">01</span>
          </div>
          <h3 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-foreground">
            Live cited research
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Every claim in a report links to the live source it came from, checkable in one click.
            You can defend the strategy line by line, because the receipts ship with it.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Grounded in:
            </span>
            {sourceChips.map((host) => (
              <span
                key={host}
                className="inline-flex items-center gap-1 rounded-[6px] bg-tan px-2 py-1 font-mono text-[11px] font-medium text-forest"
              >
                {host}
                <ArrowUpRight className="h-3 w-3" />
              </span>
            ))}
          </div>
        </article>

        {/* 02 · Reviewer loop, compact with a score chip as proof */}
        <article className="rounded-[10px] border border-hairline bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:col-span-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-tan text-forest">
              <RefreshCw className="h-5 w-5" />
            </span>
            <span className="rounded-full border border-forest/20 bg-forest/5 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest">
              8.4 / 10
            </span>
          </div>
          <h3 className="mt-4 font-serif text-xl font-semibold tracking-tight text-foreground">
            Self-correcting review
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A reviewer agent scores every concept and sends weak ones back for another pass.
            Anything below the bar never reaches your desk.
          </p>
          <p className="mt-5 border-t border-hairline pt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Draft → score → revise → ship
          </p>
        </article>

        {/* 03 · Creative library, horizontal composition on a tan wash */}
        <article className="flex gap-5 rounded-[10px] bg-tan/40 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:col-span-6 lg:col-span-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-card text-forest">
            <Library className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-serif text-xl font-semibold tracking-tight text-foreground">
              Proprietary creative library
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Concepts are built on named, proven mechanisms from a curated library of local
              marketing patterns, not whatever the model free-associates.
            </p>
            <code className="mt-3 inline-block rounded-[6px] bg-card px-2 py-1 font-mono text-[11px] text-forest">
              distinctive_asset_proof
            </code>
          </div>
        </article>

        {/* 04 · The deliverable, horizontal with a live pointer to the sample */}
        <article className="rounded-[10px] border border-hairline bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:col-span-12 md:p-7 lg:col-span-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-tan text-forest">
                <FileDown className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                  Finished, exportable reports
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  You walk away with a polished document a client could read, not a wall of chat.
                </p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Brief · Strategy · Concepts · Sources
                </p>
              </div>
            </div>
            <Link
              href="/report"
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-[10px] border border-forest/25 px-4 py-2 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-forest-foreground sm:self-center"
            >
              See the sample
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
