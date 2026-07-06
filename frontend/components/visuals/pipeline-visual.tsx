// Accurate Vantage pipeline: three research agents run in parallel (competitor,
// audience, market), converge into synthesis, then strategy -> creative <-> reviewer.
// SVG connectors animate via the .animate-dash class (globals.css).
export function PipelineVisual() {
  const research = [
    { label: "Competitor", y: 26 },
    { label: "Audience", y: 94 },
    { label: "Market", y: 162 },
  ]
  const chain = [
    { label: "Strategy", x: 290 },
    { label: "Creative", x: 418 },
    { label: "Review", x: 546 },
  ]
  return (
    <div className="rounded-[10px] border border-hairline bg-card p-5 shadow-sm">
      <svg viewBox="0 0 646 220" className="w-full" role="img" aria-label="Vantage agent pipeline">
        {/* connectors: research -> synthesis */}
        {research.map((r) => (
          <path
            key={r.label}
            d={`M122 ${r.y + 16} Q160 ${r.y + 16} 178 110`}
            fill="none"
            className="animate-dash"
            style={{ stroke: "var(--muted-foreground)", opacity: 0.5 }}
            strokeWidth={1.5}
          />
        ))}
        {/* connectors: synthesis -> strategy -> creative -> review (green) */}
        <path d="M252 110 H290" style={{ stroke: "var(--forest)" }} strokeWidth={1.8} className="animate-dash" />
        <path d="M386 110 H418" style={{ stroke: "var(--forest)" }} strokeWidth={1.8} className="animate-dash" />
        <path d="M514 110 H546" style={{ stroke: "var(--forest)" }} strokeWidth={1.8} className="animate-dash" />
        {/* refine loop: review -> creative */}
        <path
          d="M590 94 Q582 60 474 60 Q466 60 466 92"
          fill="none"
          style={{ stroke: "var(--forest)", opacity: 0.55 }}
          strokeWidth={1.4}
          strokeDasharray="4 4"
        />
        <text x="500" y="52" textAnchor="middle" style={{ fill: "var(--muted-foreground)" }} className="font-mono" fontSize="9">
          refine
        </text>

        {/* research nodes */}
        {research.map((r) => (
          <g key={r.label}>
            <rect x="6" y={r.y} width="116" height="32" rx="8" style={{ fill: "var(--card)", stroke: "var(--hairline)" }} strokeWidth={1} />
            <text x="64" y={r.y + 20} textAnchor="middle" style={{ fill: "var(--foreground)" }} className="font-mono" fontSize="11">
              {r.label}
            </text>
          </g>
        ))}

        {/* synthesis node (prominent) */}
        <rect x="178" y="80" width="74" height="60" rx="14" style={{ fill: "var(--forest)" }} />
        <text x="215" y="107" textAnchor="middle" style={{ fill: "var(--forest-foreground)" }} className="font-mono" fontSize="10">
          Synth-
        </text>
        <text x="215" y="120" textAnchor="middle" style={{ fill: "var(--forest-foreground)" }} className="font-mono" fontSize="10">
          esis
        </text>

        {/* chain nodes */}
        {chain.map((c) => (
          <g key={c.label}>
            <rect x={c.x} y="94" width="96" height="32" rx="8" style={{ fill: "var(--card)", stroke: "var(--hairline)" }} strokeWidth={1} />
            <text x={c.x + 48} y="114" textAnchor="middle" style={{ fill: "var(--foreground)" }} className="font-mono" fontSize="11">
              {c.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
