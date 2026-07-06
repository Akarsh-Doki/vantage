"use client"

import {
  CartesianGrid,
  LabelList,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { CompetitorPoint } from "@/lib/report-types"
import { chart, ChartTooltip } from "./chart-theme"

function Dot({ cx, cy, fill, r }: { cx?: number; cy?: number; fill: string; r: number }) {
  if (cx === undefined || cy === undefined) return null
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#FFFFFF" strokeWidth={1.5} />
}

export function PositioningScatter({ points }: { points: CompetitorPoint[] }) {
  const you = points.filter((p) => p.isYou)
  const rest = points.filter((p) => !p.isYou)

  return (
    <figure>
      <div className="h-[360px] w-full sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 28, right: 36, bottom: 12, left: 12 }}>
            <CartesianGrid stroke={chart.hairline} strokeDasharray="3 4" />
            {/* the ownable whitespace: fresh, mid-premium */}
            <ReferenceArea
              x1={4.4}
              x2={7.2}
              y1={7.4}
              y2={10}
              fill={chart.forest}
              fillOpacity={0.05}
              stroke={chart.forest}
              strokeOpacity={0.25}
              strokeDasharray="4 4"
            />
            <XAxis
              type="number"
              dataKey="price"
              domain={[1, 10]}
              tick={false}
              axisLine={{ stroke: chart.hairline }}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="freshness"
              domain={[1, 10]}
              tick={false}
              axisLine={{ stroke: chart.hairline }}
              tickLine={false}
              width={12}
            />
            <Tooltip
              cursor={{ stroke: chart.hairline, strokeDasharray: "3 3" }}
              content={
                <ChartTooltip
                  title={(d) => String(d.name)}
                  rows={(d) => [
                    { label: "Price position", value: `${String(d.price)} / 10` },
                    { label: "Freshness & craft", value: `${String(d.freshness)} / 10` },
                  ]}
                />
              }
            />
            <Scatter data={rest} shape={<Dot fill={chart.muted} r={7} />} isAnimationActive={false}>
              <LabelList
                dataKey="name"
                position="top"
                offset={10}
                style={{ fill: chart.muted, fontFamily: chart.font, fontSize: 11 }}
              />
            </Scatter>
            <Scatter data={you} shape={<Dot fill={chart.forest} r={10} />} isAnimationActive={false}>
              <LabelList
                dataKey="name"
                position="top"
                offset={12}
                style={{ fill: chart.forest, fontFamily: chart.font, fontSize: 12, fontWeight: 700 }}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 flex items-center justify-between gap-4 px-1">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Price position: value → premium
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          ↑ Perceived freshness &amp; craft
        </span>
      </figcaption>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 px-1">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-forest" /> You (recommended)
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-[#6B6B63]" /> Competitors
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="h-2.5 w-4 rounded-[3px] border border-dashed border-forest/40 bg-forest/5" /> Open
          territory
        </span>
      </div>
    </figure>
  )
}
