// Mimics live search results populating, in the style of Tavily's "Found sources" demo.
// Pure CSS animation (classes defined in globals.css), no client JS needed.
export function ResearchVisual() {
  const findings = [
    { delay: "0s", chip: "src 1", sub: false },
    { delay: "0.4s", chip: "src 2", sub: true },
    { delay: "0.8s", chip: "src 3", sub: false },
  ]
  return (
    <div className="rounded-[10px] border border-hairline bg-card p-6 shadow-sm">
      {/* research.run( <shimmer> ) */}
      <div className="flex items-center gap-2 rounded-[8px] border border-hairline bg-secondary/40 px-3 py-2 font-mono text-xs text-muted-foreground">
        <span>research.run(</span>
        <span className="h-2 w-24 rounded-full animate-shimmer" aria-hidden />
        <span>)</span>
      </div>

      <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Findings</p>

      <div className="mt-3 space-y-3">
        {findings.map((f) => (
          <div key={f.chip} className="animate-reveal" style={{ animationDelay: f.delay }}>
            <div className="flex items-center gap-3">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-forest text-forest-foreground">
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M2.5 6.2l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="h-2.5 flex-1 rounded-full bg-muted" aria-hidden />
              <span className="rounded-[4px] bg-tan px-1.5 py-0.5 font-mono text-[10px] font-semibold text-forest">
                {f.chip}
              </span>
            </div>
            {f.sub && (
              <div className="animate-expand ml-7 mt-2 flex gap-2" style={{ animationDelay: f.delay }}>
                <span className="h-2 w-20 rounded-full bg-secondary" aria-hidden />
                <span className="h-2 w-14 rounded-full bg-secondary" aria-hidden />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
