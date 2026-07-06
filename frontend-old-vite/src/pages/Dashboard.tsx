import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppHeader } from '@/components/AppHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { derivePhase } from '@/hooks/usePollReport'
import { api } from '@/lib/api'
import type { RunListResponse, RunSummary } from '@/lib/types'

export default function Dashboard() {
  const [runs, setRuns] = useState<RunSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await api.get<RunListResponse>('/reports')
        if (active) setRuns(res.runs)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load your reports.')
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppHeader />
      <main className="reading-column py-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Your campaigns
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Dashboard</h1>
          </div>
          <Button asChild>
            <Link to="/new">New report</Link>
          </Button>
        </div>

        <div className="mt-10 space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {runs === null && !error ? (
            <p className="font-mono text-sm text-muted-foreground">Loading…</p>
          ) : null}

          {runs !== null && runs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No campaigns yet — start your first one.
              </CardContent>
            </Card>
          ) : null}

          {runs?.map((run) => {
            const phase = derivePhase(run.status, run.current_step)
            const target =
              run.status === 'awaiting_review' ? `/review/${run.run_id}` : `/report/${run.run_id}`
            return (
              <Link key={run.run_id} to={target} className="block">
                <Card>
                  <CardContent className="flex items-center justify-between gap-4 py-5">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-foreground">{run.run_id}</p>
                      <p className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        {run.kind}
                      </p>
                    </div>
                    <StatusBadge phase={phase} />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
