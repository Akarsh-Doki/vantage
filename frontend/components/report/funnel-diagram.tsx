"use client"

import { ArrowDown } from "lucide-react"
import type { FunnelStage } from "@/lib/report-types"

const fillStyles = ["bg-tan", "bg-forest-hover", "bg-forest"]

/** Three-stage retention funnel as styled stacked bars (no chart lib needed). */
export function FunnelDiagram({ stages }: { stages: FunnelStage[] }) {
  return (
    <ol className="space-y-1.5">
      {stages.map((stage, i) => (
        <li key={stage.name}>
          {stage.fromPrevious ? (
            <div className="flex items-center gap-2 py-2 pl-1">
              <ArrowDown className="h-3.5 w-3.5 text-forest" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-forest">
                {stage.fromPrevious}
              </span>
            </div>
          ) : null}
          <div className="mb-1.5 flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium leading-snug">{stage.name}</p>
              <p className="text-xs leading-snug text-muted-foreground">{stage.detail}</p>
            </div>
            <span className="shrink-0 font-mono text-lg font-semibold tabular-nums text-forest">
              {stage.share}%
            </span>
          </div>
          <div className="h-8 w-full overflow-hidden rounded-[8px] bg-secondary/50">
            <div
              className={`h-full rounded-[8px] ${fillStyles[Math.min(i, fillStyles.length - 1)] ?? "bg-forest"}`}
              style={{ width: `${String(stage.share)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
