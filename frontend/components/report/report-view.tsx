import type { ReactNode } from "react"
import type { ReportData } from "@/lib/report-types"
import { AudienceSection } from "./audience-section"
import { CompetitiveLandscape } from "./competitive-landscape"
import { CreativeConcepts } from "./creative-concepts"
import { ExecutiveSummary } from "./executive-summary"
import { Measurement } from "./measurement"
import { PositioningSection } from "./positioning-section"
import { ReportHeader } from "./report-header"
import { Reveal } from "./reveal"
import { Sources } from "./sources"
import { StrategySection } from "./strategy-section"

/** Alternating full-width band: cream (page bg) / white / soft tan tint. */
function Band({
  tone,
  width,
  children,
}: {
  tone: "cream" | "white" | "tan"
  width: "prose" | "data"
  children: ReactNode
}) {
  const toneClass = tone === "white" ? "border-y border-hairline bg-white" : tone === "tan" ? "bg-tan/25" : ""
  const widthClass = width === "prose" ? "max-w-[760px]" : "max-w-[1000px]"
  return (
    <section className={toneClass}>
      <div className={`mx-auto ${widthClass} px-6 py-20 md:py-24`}>{children}</div>
    </section>
  )
}

/*
 * The one composition both report pages share: the public sample feeds it the
 * illustrative ReportData, the authenticated view feeds it real data through
 * lib/report-adapter.ts. Sections without data don't render, and the numbered
 * eyebrows stay sequential either way.
 */
export function ReportView({
  data,
  badge,
  backHref,
  actions,
  footer,
}: {
  data: ReportData
  badge?: string
  backHref?: string
  actions?: ReactNode
  footer?: ReactNode
}) {
  const hasConcepts = Boolean(data.concepts && data.concepts.length > 0)
  const hasKpis = Boolean(data.kpis && data.kpis.length > 0)
  const hasSources = Boolean(data.sources && data.sources.length > 0)

  // Sequential section numbers over whichever numbered sections are present.
  const numberedSections = [
    Boolean(data.executiveSummary),
    Boolean(data.landscape),
    Boolean(data.audience),
    Boolean(data.positioning),
    Boolean(data.strategy),
    hasConcepts,
    hasKpis,
  ]
  const numberOf = (position: number): string => {
    const n = numberedSections.slice(0, position + 1).filter(Boolean).length
    return String(n).padStart(2, "0")
  }

  return (
    <main className="min-h-screen bg-background">
      <ReportHeader meta={data.meta} badge={badge} backHref={backHref} actions={actions} />

      {/* AI disclosure. Shared composition, so the sample and the full report
          both carry it, and it stays in the print export on purpose: no
          report-action-bar class (globals.css hides that class in @media
          print). Keep the word "AI" in the text. */}
      <div className="border-b border-hairline">
        <p className="mx-auto max-w-[760px] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          AI-generated report. Suggestions, not professional advice. Verify details before acting.
        </p>
      </div>

      {data.executiveSummary ? (
        <Band tone="tan" width="data">
          <Reveal>
            <ExecutiveSummary data={data.executiveSummary} eyebrow={`${numberOf(0)} / Executive Summary`} />
          </Reveal>
        </Band>
      ) : null}

      {data.landscape ? (
        <Band tone="white" width="data">
          <Reveal>
            <CompetitiveLandscape
              data={data.landscape}
              eyebrow={`${numberOf(1)} / Market & Competitive Landscape`}
            />
          </Reveal>
        </Band>
      ) : null}

      {data.audience ? (
        <Band tone="tan" width="data">
          <Reveal>
            <AudienceSection data={data.audience} eyebrow={`${numberOf(2)} / Audience & Segmentation`} />
          </Reveal>
        </Band>
      ) : null}

      {data.positioning ? (
        <Band tone="cream" width="prose">
          <Reveal>
            <PositioningSection data={data.positioning} number={numberOf(3)} />
          </Reveal>
        </Band>
      ) : null}

      {data.strategy ? (
        <Band tone="white" width="data">
          <Reveal>
            <StrategySection data={data.strategy} eyebrow={`${numberOf(4)} / Strategy`} />
          </Reveal>
        </Band>
      ) : null}

      {hasConcepts ? (
        <Band tone="tan" width="prose">
          <Reveal>
            <CreativeConcepts
              concepts={data.concepts ?? []}
              sources={data.sources ?? []}
              eyebrow={`${numberOf(5)} / Creative Concepts`}
            />
          </Reveal>
        </Band>
      ) : null}

      {hasKpis ? (
        <Band tone="white" width="prose">
          <Reveal>
            <Measurement
              kpis={data.kpis ?? []}
              eyebrow={`${numberOf(6)} / Measurement`}
              cites={data.kpiCites}
            />
          </Reveal>
        </Band>
      ) : null}

      {hasSources ? (
        <Band tone="cream" width="prose">
          <Reveal>
            <Sources sources={data.sources ?? []} />
          </Reveal>
        </Band>
      ) : null}

      {footer}
    </main>
  )
}
