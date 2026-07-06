// Shared theming for every report chart — never recharts defaults.

export const chart = {
  forest: "#1E3D2F",
  forestHover: "#2D5F45",
  tan: "#E8E2D5",
  cream: "#FAFAF8",
  ink: "#1A1A17",
  muted: "#6B6B63",
  hairline: "#EAE8E2",
  font: "var(--font-geist-mono), ui-monospace, monospace",
} as const

export const axisTickStyle = {
  fill: chart.muted,
  fontFamily: chart.font,
  fontSize: 11,
} as const

/** Minimal shape of what recharts hands a custom tooltip. */
interface TooltipEntry {
  name?: string
  value?: number | string
  payload?: Record<string, unknown>
}

export function ChartTooltip({
  active,
  payload,
  title,
  rows,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  /** derive a heading from the hovered datum */
  title?: (datum: Record<string, unknown>) => string
  /** derive label/value rows from the hovered datum */
  rows: (datum: Record<string, unknown>) => { label: string; value: string }[]
}) {
  const datum = payload?.[0]?.payload
  if (!active || !datum) return null
  return (
    <div className="rounded-[10px] border border-hairline bg-white px-3.5 py-2.5 shadow-sm">
      {title ? (
        <p className="font-serif text-sm font-medium tracking-tight text-foreground">{title(datum)}</p>
      ) : null}
      <dl className="mt-1 space-y-0.5">
        {rows(datum).map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.label}</dt>
            <dd className="font-mono text-xs font-semibold text-forest">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
