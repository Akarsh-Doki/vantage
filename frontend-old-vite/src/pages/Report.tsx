import { Link, useParams } from 'react-router-dom'

import { AppHeader } from '@/components/AppHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePollReport } from '@/hooks/usePollReport'
import type { ReportPhase } from '@/lib/types'

// The progress track, in order. `awaiting_review` is a real pause point.
const STEPS: { phase: ReportPhase; label: string }[] = [
  { phase: 'queued', label: 'Queued' },
  { phase: 'researching', label: 'Researching the market' },
  { phase: 'awaiting_review', label: 'Awaiting your review' },
  { phase: 'generating', label: 'Generating the campaign' },
  { phase: 'done', label: 'Ready' },
]
const ORDER = STEPS.map((step) => step.phase)

function JsonSection({ title, value }: { title: string; value: unknown }) {
  if (value === null || value === undefined) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
          {JSON.stringify(value, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}

function Stepper({ phase }: { phase: ReportPhase }) {
  const currentIndex = ORDER.indexOf(phase)
  return (
    <ol className="space-y-4">
      {STEPS.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const dot = done
          ? 'bg-primary'
          : active
            ? 'bg-primary ring-4 ring-primary-subtle'
            : 'bg-border'
        const text = done || active ? 'text-foreground' : 'text-muted-foreground'
        return (
          <li key={step.phase} className="flex items-center gap-3">
            <span className={`h-3 w-3 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
            <span className={`text-sm ${text}`}>{step.label}</span>
            {active ? (
              <span className="font-mono text-xs text-primary">
                {phase === 'awaiting_review' ? '' : 'in progress…'}
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

export default function Report() {
  const { id } = useParams()
  const { data, phase, isLoading, error } = usePollReport(id)

  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppHeader />
      <main className="reading-column py-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Campaign</p>
            <h1 className="mt-2 truncate font-mono text-xl font-medium tracking-tight">{id}</h1>
          </div>
          {phase ? <StatusBadge phase={phase} /> : null}
        </div>

        <div className="mt-10 space-y-6">
          {isLoading && !data ? (
            <p className="font-mono text-sm text-muted-foreground">Loading…</p>
          ) : null}

          {phase === 'failed' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-destructive">Generation failed</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {data?.error ?? error ?? 'Something went wrong. You can start a new campaign.'}
              </CardContent>
            </Card>
          ) : null}

          {phase && phase !== 'failed' && phase !== 'done' ? (
            <Card>
              <CardContent className="py-8">
                <Stepper phase={phase} />
                {phase === 'awaiting_review' ? (
                  <div className="mt-8 border-t border-border pt-6">
                    <p className="text-sm text-foreground">
                      Your draft is ready. Review it to generate the final campaign.
                    </p>
                    <Button asChild className="mt-4">
                      <Link to={`/review/${id ?? ''}`}>Review the draft</Link>
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {phase === 'done' && data?.report ? (
            <>
              <JsonSection title="Brief" value={data.report.brief} />
              <JsonSection title="Strategy" value={data.report.strategy} />
              <JsonSection title="Creative" value={data.report.creative} />
              {data.report.sources && data.report.sources.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.report.sources.map((source) => (
                        <li key={source} className="font-mono text-sm text-muted-foreground">
                          {source}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}
