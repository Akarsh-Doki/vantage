import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CtaBand() {
  return (
    // `isolate`: see hero.tsx. Keeps the -z-10 image above the body background.
    // The #pricing anchor lives on the real pricing section now, not here.
    <section className="relative isolate overflow-hidden border-t border-border">
      {/* Drop a lush green landscape at public/images/cta-landscape.jpg */}
      <div className="decorative-bg absolute inset-0 -z-10">
        <img src="/images/cta-landscape.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.985 0.003 95 / 0.9) 0%, oklch(0.985 0.003 95 / 0.72) 50%, oklch(0.985 0.003 95 / 0.85) 100%)",
          }}
        />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 sm:py-32">
        <h2 className="text-balance font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          See what Vantage builds
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Run a full research, strategy, and creative pass on your business and see the finished report for yourself.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/report"
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-forest px-6 py-3 text-sm font-medium text-forest-foreground transition-opacity hover:opacity-90"
          >
            See a sample report
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
