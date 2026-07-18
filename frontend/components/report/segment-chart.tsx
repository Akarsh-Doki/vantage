"use client"

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useInView } from "@/hooks/use-in-view"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { AudienceSegment } from "@/lib/report-types"
import { axisTickStyle, chart, ChartTooltip } from "./chart-theme"

/** Value label at the bar end. The primary bar also gets its annotation. */
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
          ↑ the plan is written for them
        </text>
      ) : null}
    </g>
  )
}

export function SegmentChart({ segments }: { segments: AudienceSegment[] }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()
  // Direct-labeled bars need breathing room past the largest value.
  const domainMax = Math.max(50, ...segments.map((s) => s.share)) + 10
  return (
    <div ref={ref} className="h-[260px] w-full">
      {inView ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={segments} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 4 }}>
            <XAxis type="number" domain={[0, domainMax]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={148}
              tick={{ ...axisTickStyle, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={false}
              content={
                <ChartTooltip
                  title={(d) => String(d.name)}
                  rows={(d) => [{ label: "Share of audience", value: `${String(d.share)}%` }]}
                />
              }
            />
            <Bar
              dataKey="share"
              radius={[0, 6, 6, 0]}
              barSize={26}
              isAnimationActive={!reduced}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {segments.map((s) => (
                <Cell key={s.name} fill={s.isPrimary ? chart.forest : chart.tan} />
              ))}
              <LabelList dataKey="share" content={<BarLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  )
}
