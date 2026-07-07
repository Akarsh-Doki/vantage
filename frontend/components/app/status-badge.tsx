import type { ReportStatus } from "@/lib/types"

const config: Record<ReportStatus, { label: string; className: string; live?: boolean }> = {
  queued: { label: "Queued", className: "border border-hairline bg-card text-muted-foreground" },
  researching: { label: "Researching", className: "bg-forest/10 text-forest", live: true },
  awaiting_review: { label: "Awaiting review", className: "bg-tan text-forest" },
  generating: { label: "Generating", className: "bg-forest/10 text-forest-hover", live: true },
  done: { label: "Done", className: "bg-forest text-forest-foreground" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, className, live } = config[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider ${className}`}
    >
      {live ? <span className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-pulse" aria-hidden /> : null}
      {label}
    </span>
  )
}
