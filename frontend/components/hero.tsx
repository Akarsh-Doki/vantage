import Link from "next/link"
import { ArrowRight, FileText } from "lucide-react"
import { TextType } from "@/components/reactbits/text-type"
import { GlassSurface } from "@/components/reactbits/glass-surface"

export function Hero() {
  return (
    // `isolate` gives the section its own stacking context so the -z-10 background
    // image paints above the opaque body background instead of behind it.
    <section className="relative isolate flex min-h-[calc(100svh-3.5rem)] items-center overflow-hidden">
      {/* Background nature image. Drop a lush green landscape at public/images/hero-landscape.jpg */}
      <div className="decorative-bg absolute inset-0 -z-10">
        <img
          src="/images/hero-landscape.jpg"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        {/* Warm off-white scrim — light enough to let the landscape read, strongest behind the copy */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, oklch(0.985 0.003 95 / 0.78) 0%, oklch(0.985 0.003 95 / 0.6) 42%, oklch(0.985 0.003 95 / 0.22) 100%)",
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 font-mono text-xs uppercase tracking-wider text-forest">
            <span className="h-1.5 w-1.5 rounded-full bg-forest" />
            AI marketing strategist
          </span>

          {/*
            Headline uses the TextType (React Bits) typing effect.
            To revert to a plain static headline, replace the <h1> below with:
            <h1 className="mt-6 text-balance font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Your AI marketing team, in minutes
            </h1>
          */}
          <h1 className="mt-6 min-h-[3.5em] text-balance font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:min-h-[2.4em] sm:text-6xl lg:text-7xl">
            <TextType
              text={["Your AI marketing team, in minutes", "Research, strategy, and creative in one run"]}
              typingSpeed={55}
              deletingSpeed={28}
              pauseDuration={2600}
              showCursor
              cursorCharacter="|"
              cursorClassName="text-forest"
            />
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Vantage researches your market, builds a strategy, and writes finished campaigns for
            your local business. Every claim cited, every concept scored.
          </p>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-forest px-6 py-3 text-sm font-medium text-forest-foreground transition-opacity hover:opacity-90"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Glass button (React Bits GlassSurface) sits over the hero image where the frosted effect reads well. */}
            <GlassSurface
              width={224}
              height={48}
              borderRadius={10}
              className="text-sm font-medium text-foreground"
            >
              <Link href="/report" className="inline-flex items-center justify-center gap-2 px-2">
                <FileText className="h-4 w-4" />
                See a sample report
              </Link>
            </GlassSurface>
          </div>
        </div>
      </div>
    </section>
  )
}
