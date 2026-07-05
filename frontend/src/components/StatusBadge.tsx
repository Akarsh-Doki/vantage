import type { ReportPhase } from '@/lib/types'

const LABELS: Record<ReportPhase, string> = {
  queued: 'Queued',
  researching: 'Researching',
  awaiting_review: 'Awaiting review',
  generating: 'Generating',
  done: 'Done',
  failed: 'Failed',
}

function toneFor(phase: ReportPhase): string {
  switch (phase) {
    case 'done':
      return 'bg-primary text-primary-foreground'
    case 'failed':
      return 'bg-destructive text-destructive-foreground'
    case 'awaiting_review':
      return 'bg-secondary text-secondary-foreground'
    default:
      return 'bg-primary-subtle text-primary'
  }
}

export function StatusBadge({ phase }: { phase: ReportPhase }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] ${toneFor(phase)}`}
    >
      {LABELS[phase]}
    </span>
  )
}
