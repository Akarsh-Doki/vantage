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
import type { Channel } from "@/lib/report-types"
import { axisTickStyle, chart, ChartTooltip } from "./chart-theme"

export function ChannelChart({ channels }: { channels: Channel[] }) {
  return (
    <div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={channels} layout="vertical" margin={{ top: 4, right: 44, bottom: 0, left: 8 }}>
            <CartesianGrid stroke={chart.hairline} strokeDasharray="3 4" horizontal={false} />
            <XAxis type="number" domain={[0, 40]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={168}
              tick={{ ...axisTickStyle, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: chart.tan, fillOpacity: 0.35 }}
              content={
                <ChartTooltip
                  title={(d) => String(d.name)}
                  rows={(d) => [{ label: "Recommended weight", value: `${String(d.weight)}%` }]}
                />
              }
            />
            <Bar dataKey="weight" radius={[0, 6, 6, 0]} barSize={24} isAnimationActive={false}>
              {channels.map((c, i) => (
                <Cell key={c.name} fill={i === 0 ? chart.forest : i === 1 ? chart.forestHover : chart.tan} />
              ))}
              <LabelList
                dataKey="weight"
                position="right"
                offset={8}
                formatter={(v) => `${String(v)}%`}
                style={{ fill: chart.ink, fontFamily: chart.font, fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 grid gap-x-8 gap-y-2 border-t border-hairline pt-4 sm:grid-cols-2">
        {channels.map((c) => (
          <li key={c.name} className="text-sm leading-relaxed">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-forest">
              {c.name}
            </span>{" "}
            <span className="text-muted-foreground">— {c.rationale}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
