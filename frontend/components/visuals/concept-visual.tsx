// A concept card assembling itself: mechanism tag, title, idea bars, score, review check.
// Pure CSS build-up animation (globals.css .animate-buildup).
export function ConceptVisual() {
  return (
    <div className="rounded-[10px] border border-hairline bg-card p-6 shadow-sm">
      <div className="rounded-[10px] border border-hairline bg-secondary/30 p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className="animate-buildup inline-flex items-center rounded-[6px] bg-tan px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-forest"
            style={{ animationDelay: "0s" }}
          >
            Distinctive asset proof
          </span>
          <span
            className="animate-buildup shrink-0 rounded-full border border-forest/20 bg-forest/5 px-2.5 py-1 font-mono text-sm font-semibold text-forest"
            style={{ animationDelay: "1.2s" }}
          >
            8.4 / 10
          </span>
        </div>

        <div className="animate-buildup mt-4 h-3 w-3/4 rounded-full bg-muted" style={{ animationDelay: "0.4s" }} aria-hidden />

        <div className="mt-4 space-y-2">
          <div className="animate-buildup h-2.5 w-full rounded-full bg-secondary" style={{ animationDelay: "0.7s" }} aria-hidden />
          <div className="animate-buildup h-2.5 w-5/6 rounded-full bg-secondary" style={{ animationDelay: "0.9s" }} aria-hidden />
        </div>

        <div className="animate-buildup mt-5 flex items-center gap-1.5 text-forest" style={{ animationDelay: "1.5s" }}>
          <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M2.5 6.2l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mono text-[11px] uppercase tracking-wider">reviewed</span>
        </div>
      </div>
    </div>
  )
}
