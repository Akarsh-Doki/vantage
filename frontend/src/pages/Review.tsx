import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { usePollReport } from '@/hooks/usePollReport'
import { api } from '@/lib/api'
import type { RunCreated } from '@/lib/types'

export default function Review() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { phase, isLoading, error } = usePollReport(id)

  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Once the resumed run completes, send the user to the finished report.
  useEffect(() => {
    if (phase === 'done') {
      void navigate(`/report/${id ?? ''}`, { replace: true })
    }
  }, [phase, id, navigate])

  const submit = async (approved: boolean) => {
    if (!id) return
    setSubmitting(true)
    setActionError(null)
    try {
      await api.post<RunCreated>(`/reports/${id}/approve`, {
        approved,
        feedback: feedback.trim() || null,
      })
      // The run resumes (generating → done); usePollReport keeps polling and
      // the effect above redirects once it lands.
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not submit your review.')
      setSubmitting(false)
    }
  }

  const body = () => {
    if (isLoading) {
      return <p className="font-mono text-sm text-muted-foreground">Loading…</p>
    }
    if (phase === 'failed') {
      return <p className="text-sm text-destructive">{error ?? 'This run failed.'}</p>
    }
    // Approved and finishing, or already generating — show progress.
    if (submitting || phase === 'generating') {
      return <p className="font-mono text-sm text-muted-foreground">Finalizing your campaign…</p>
    }
    // Still working and not yet paused for review.
    if (phase && phase !== 'awaiting_review') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            This campaign isn’t ready for review yet — it’s still {phase}.
          </p>
          <Button asChild variant="outline">
            <Link to={`/report/${id ?? ''}`}>View progress</Link>
          </Button>
        </div>
      )
    }
    // awaiting_review
    return (
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-foreground">
          Vantage drafted your campaign and paused for your approval. Approve to generate the final
          deliverable, or send notes to revise it first.
        </p>
        <div className="space-y-2">
          <label htmlFor="feedback" className="text-sm font-medium text-foreground">
            Notes for revision (optional)
          </label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(event) => {
              setFeedback(event.target.value)
            }}
            placeholder="Lean more local, drop the discount angle…"
          />
        </div>
        {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void submit(true)}>Approve &amp; finish</Button>
          <Button
            variant="outline"
            disabled={feedback.trim().length === 0}
            onClick={() => void submit(false)}
          >
            Request changes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppHeader />
      <main className="reading-column py-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Review</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
          Review your campaign
        </h1>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Draft ready</CardTitle>
          </CardHeader>
          <CardContent>{body()}</CardContent>
        </Card>
      </main>
    </div>
  )
}
