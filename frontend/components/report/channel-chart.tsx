"use client"

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useInView } from "@/hooks/use-in-view"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { Channel } from "@/lib/report-types"
import { axisTickStyle, chart, ChartTooltip } from "./chart-theme"

function BarLabel(props: {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  value?: number | string
  index?: number
}) {
  const x = Number(props.x ?? 0)
  const y = Number(props.y ?? 0)
  const width = Number(props.width ?? 0)
  const height = Number(props.height ?? 0)
  const primary = props.index === 0
  return (
    <g>
      <text
        x={x + width + 8}
        y={y + height / 2 + 4}
        style={{
          fill: primary ? chart.forest : chart.muted,
          fontFamily: chart.font,
          fontSize: 12,
          fontWeight: primary ? 700 : 500,
        }}
      >
        {props.value}%
      </text>
      {primary ? (
        <text
          x={x + 2}
          y={y + height + 14}
          style={{ fill: chart.forest, fontFamily: chart.font, fontSize: 10.5, fontWeight: 600 }}
        >
          ↑ lead here, everything else supports
        </text>
      ) : null}
    </g>
  )
}

export function ChannelChart({ channels }: { channels: Channel[] }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()
  const domainMax = Math.max(40, ...channels.map((c) => c.weight)) + 10
  return (
    <div ref={ref}>
      <div className="h-[250px] w-full">
        {inView ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channels} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 4 }}>
              <XAxis type="number" domain={[0, domainMax]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={168}
                tick={{ ...axisTickStyle, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={false}
                content={
                  <ChartTooltip
                    title={(d) => String(d.name)}
                    rows={(d) => [{ label: "Recommended weight", value: `${String(d.weight)}%` }]}
                  />
                }
              />
              <Bar
                dataKey="weight"
                radius={[0, 6, 6, 0]}
                barSize={24}
                isAnimationActive={!reduced}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {channels.map((c, i) => (
                  <Cell key={c.name} fill={i === 0 ? chart.forest : chart.tan} />
                ))}
                <LabelList dataKey="weight" content={<BarLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
      <ul className="mt-4 space-y-2 border-t border-hairline pt-4">
        {channels.map((c) => (
          <li key={c.name} className="text-sm leading-relaxed">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-forest">
              {c.name}
            </span>{" "}
            {c.rationale ? <span className="text-muted-foreground">· {c.rationale}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
