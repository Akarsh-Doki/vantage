"use client"

import {
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useInView } from "@/hooks/use-in-view"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { CompetitorPoint } from "@/lib/report-types"
import { chart, ChartTooltip } from "./chart-theme"

/*
 * Hand-placed label offsets for the sample's points so nothing overlaps.
 * Unknown names (real reports) get the safe below-point default.
 */
const LABEL_POS: Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  Ridgeline: { dx: 0, dy: 30, anchor: "middle" },
  "Copper Kettle": { dx: 6, dy: -12, anchor: "end" },
}

type Highlight = { x1: number; x2: number; y1: number; y2: number; title: string; note?: string }

function PointWithLabel(props: {
  cx?: number
  cy?: number
  payload?: CompetitorPoint
  index?: number
  animate?: boolean
}) {
  const { cx, cy, payload, index = 0, animate = false } = props
  if (cx === undefined || cy === undefined || !payload) return null
  const pos = LABEL_POS[payload.name] ?? { dx: 0, dy: 22, anchor: "middle" as const }
  const style = animate
    ? {
        opacity: 0,
        animation: `vantage-chart-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        animationDelay: `${String(index * 90)}ms`,
      }
    : undefined
  if (payload.isYou) {
    return (
      <g style={style}>
        <circle cx={cx} cy={cy} r={16} fill={chart.forest} fillOpacity={0.12} />
        <circle cx={cx} cy={cy} r={8} fill={chart.forest} stroke="#FFFFFF" strokeWidth={2} />
        <text
          x={cx + pos.dx}
          y={cy + pos.dy}
          textAnchor={pos.anchor}
          style={{ fill: chart.forest, fontFamily: chart.font, fontSize: 12.5, fontWeight: 700 }}
        >
          {payload.name} (you)
        </text>
      </g>
    )
  }
  return (
    <g style={style}>
      <circle cx={cx} cy={cy} r={5.5} fill={chart.muted} fillOpacity={0.85} stroke="#FFFFFF" strokeWidth={1.5} />
      <text
        x={cx + pos.dx}
        y={cy + pos.dy}
        textAnchor={pos.anchor}
        style={{ fill: chart.muted, fontFamily: chart.font, fontSize: 11 }}
      >
        {payload.name}
      </text>
    </g>
  )
}

function HighlightLabel(props: {
  title: string
  note?: string
  viewBox?: { x?: number; y?: number; width?: number; height?: number }
}) {
  const { x = 0, y = 0, width = 0 } = props.viewBox ?? {}
  const cx = x + width / 2
  return (
    <g>
      <text
        x={cx}
        y={y + 18}
        textAnchor="middle"
        style={{ fill: chart.forest, fontFamily: chart.font, fontSize: 11.5, fontWeight: 700 }}
      >
        {props.title}
      </text>
      {props.note ? (
        <text
          x={cx}
          y={y + 32}
          textAnchor="middle"
          style={{ fill: chart.forest, fontFamily: chart.font, fontSize: 11 }}
        >
          {props.note}
        </text>
      ) : null}
    </g>
  )
}

export function PositioningScatter({
  points,
  xLabel,
  yLabel,
  highlight,
}: {
  points: CompetitorPoint[]
  xLabel: string
  yLabel: string
  highlight?: Highlight
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()
  return (
    <figure ref={ref}>
      <div className="relative h-[380px] w-full sm:h-[430px]">
        <span className="absolute left-1 top-0 z-10 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          ↑ {yLabel}
        </span>
        {inView ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 28, bottom: 12, left: 12 }}>
              {/* quadrant hint: one faint midline each way, no grid */}
              <ReferenceLine x={5} stroke={chart.hairline} />
              <ReferenceLine y={5} stroke={chart.hairline} />
              {highlight ? (
                <ReferenceArea
                  x1={highlight.x1}
                  x2={highlight.x2}
                  y1={highlight.y1}
                  y2={highlight.y2}
                  fill={chart.forest}
                  fillOpacity={0.05}
                  stroke={chart.forest}
                  strokeOpacity={0.3}
                  strokeDasharray="5 5"
                  label={<HighlightLabel title={highlight.title} note={highlight.note} />}
                />
              ) : null}
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 10]}
                tick={false}
                axisLine={{ stroke: chart.hairline }}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 10]}
                tick={false}
                axisLine={{ stroke: chart.hairline }}
                tickLine={false}
                width={12}
              />
              <Tooltip
                cursor={false}
                content={
                  <ChartTooltip
                    title={(d) => String(d.name)}
                    rows={(d) => [
                      { label: xLabel, value: `${String(d.x)} / 10` },
                      { label: yLabel, value: `${String(d.y)} / 10` },
                    ]}
                  />
                }
              />
              <Scatter data={points} shape={<PointWithLabel animate={!reduced} />} isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      <figcaption className="mt-2 px-1 text-right">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {xLabel} →
        </span>
      </figcaption>
    </figure>
  )
}
