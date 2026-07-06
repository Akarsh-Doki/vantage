"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { AudienceSegment } from "@/lib/report-types"
import { axisTickStyle, chart, ChartTooltip } from "./chart-theme"

export function SegmentChart({ segments }: { segments: AudienceSegment[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={segments} layout="vertical" margin={{ top: 4, right: 44, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={chart.hairline} strokeDasharray="3 4" horizontal={false} />
          <XAxis type="number" domain={[0, 50]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={148}
            tick={{ ...axisTickStyle, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: chart.tan, fillOpacity: 0.35 }}
            content={
              <ChartTooltip
                title={(d) => String(d.name)}
                rows={(d) => [{ label: "Share of audience", value: `${String(d.share)}%` }]}
              />
            }
          />
          <Bar dataKey="share" radius={[0, 6, 6, 0]} barSize={26} isAnimationActive={false}>
            {segments.map((s) => (
              <Cell key={s.name} fill={s.isPrimary ? chart.forest : chart.tan} />
            ))}
            <LabelList
              dataKey="share"
              position="right"
              offset={8}
              formatter={(v) => `${String(v)}%`}
              style={{ fill: chart.ink, fontFamily: chart.font, fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
