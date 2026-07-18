"use client"

import { useInView } from "@/hooks/use-in-view"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { FunnelStage } from "@/lib/report-types"

const STAGE_STYLE = [
  { fill: "bg-tan", text: "text-foreground", sub: "text-muted-foreground", connector: "#E8E2D5" },
  { fill: "bg-forest-hover", text: "text-white", sub: "text-white/70", connector: "#2D5F45" },
  { fill: "bg-forest", text: "text-white", sub: "text-white/70", connector: "#1E3D2F" },
]

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"

/**
 * A funnel that actually tapers: centered stages narrow with each drop and
 * SVG trapezoids connect them. Stages ease in one after another when scrolled
 * into view (instant under prefers-reduced-motion), and the steepest drop
 * carries the annotation when the caller provides one.
 */
export function FunnelDiagram({ stages, dropLabel }: { stages: FunnelStage[]; dropLabel?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()
  const shown = reduced || inView

  // The annotated drop is the largest absolute fall in the data.
  let biggestDropIndex = -1
  let biggestDrop = 0
  stages.forEach((stage, i) => {
    if (i === 0) return
    const drop = (stages[i - 1]?.share ?? 0) - stage.share
    if (drop > biggestDrop) {
      biggestDrop = drop
      biggestDropIndex = i
    }
  })

  const stageMotion = (i: number) =>
    reduced
      ? undefined
      : {
          opacity: shown ? 1 : 0,
          transform: shown ? "none" : "scaleX(0.6) translateY(8px)",
          transition: `opacity 0.6s ${EASE}, transform 0.6s ${EASE}`,
          transitionDelay: `${String(i * 140)}ms`,
        }

  return (
    <div ref={ref}>
      {stages.map((stage, i) => {
        const style = STAGE_STYLE[Math.min(i, STAGE_STYLE.length - 1)] ?? STAGE_STYLE[0]!
        const prev = i > 0 ? stages[i - 1] : null
        return (
          <div key={stage.name}>
            {prev ? (
              <div className="relative h-7" style={stageMotion(i)}>
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <polygon
                    points={`${50 - prev.share / 2},0 ${50 + prev.share / 2},0 ${50 + stage.share / 2},10 ${50 - stage.share / 2},10`}
                    fill={style.connector}
                    fillOpacity={0.28}
                  />
                </svg>
                {stage.fromPrevious ? (
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-forest shadow-sm">
                    {stage.fromPrevious}
                  </span>
                ) : null}
                {dropLabel && i === biggestDropIndex ? (
                  <span className="absolute right-0 top-1/2 hidden -translate-y-1/2 whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-wider text-forest sm:block">
                    {dropLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div
              className={`mx-auto flex min-h-[54px] items-center justify-between gap-3 rounded-[8px] px-4 py-2.5 ${style.fill}`}
              style={{ width: `${String(stage.share)}%`, minWidth: "13rem", ...stageMotion(i) }}
            >
              <div className="min-w-0">
                <p className={`whitespace-nowrap text-[13px] font-medium leading-snug ${style.text}`}>
                  {stage.name}
                </p>
                {stage.detail ? (
                  <p className={`text-[10.5px] leading-snug ${style.sub}`}>{stage.detail}</p>
                ) : null}
              </div>
              <span className={`shrink-0 font-mono text-lg font-semibold tabular-nums ${style.text}`}>
                {stage.share}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
