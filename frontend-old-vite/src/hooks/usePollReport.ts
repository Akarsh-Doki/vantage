import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, api } from '@/lib/api'
import type { ReportPhase, RunStatus } from '@/lib/types'

const POLL_INTERVAL_MS = 2000

/** Collapse the backend `status` + `current_step` into one product phase. */
export function derivePhase(status: string, currentStep: string | null): ReportPhase {
  switch (status) {
    case 'queued':
      return 'queued'
    case 'awaiting_review':
      return 'awaiting_review'
    case 'completed':
      return 'done'
    case 'failed':
      return 'failed'
    case 'running': {
      const step = currentStep ?? ''
      if (step.startsWith('generating') || step === 'finalizing') return 'generating'
      // research:* or not-yet-set — the first running phase is research.
      return 'researching'
    }
    default:
      return 'queued'
  }
}

export interface PollReportResult {
  data: RunStatus | null
  phase: ReportPhase | null
  /** True until the first response (success or error) lands. */
  isLoading: boolean
  /** True while the 2s poll is still running (stops on `done`/`failed`/404). */
  isPolling: boolean
  error: string | null
  /** Restart polling — useful after a transient failure. */
  refetch: () => void
}

/**
 * Poll GET /reports/:id every 2s, walking the run through
 * queued → researching → awaiting_review → generating → done | failed.
 * Polling stops at the terminal states (done/failed) and on a 404; transient
 * network/5xx errors are surfaced but keep retrying.
 */
export function usePollReport(id: string | undefined): PollReportResult {
  const [data, setData] = useState<RunStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPolling, setIsPolling] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelled = useRef(false)
  // Holds the latest `poll` so the recursive setTimeout never has to reference
  // `poll` from inside its own definition; wired up in the effect below.
  const scheduleNext = useRef<() => void>(() => undefined)

  // Every state update lives in this async worker (never in the effect body) so
  // re-renders are driven by responses, not by the effect firing.
  const poll = useCallback(async () => {
    if (!id) {
      setIsLoading(false)
      setIsPolling(false)
      return
    }
    setIsPolling(true)
    try {
      const next = await api.get<RunStatus>(`/reports/${id}`)
      if (cancelled.current) return
      setData(next)
      setError(null)
      setIsLoading(false)
      const phase = derivePhase(next.status, next.current_step)
      if (phase === 'done' || phase === 'failed') {
        setIsPolling(false)
        return
      }
      timer.current = setTimeout(() => {
        scheduleNext.current()
      }, POLL_INTERVAL_MS)
    } catch (err) {
      if (cancelled.current) return
      setError(err instanceof Error ? err.message : 'Failed to load report')
      setIsLoading(false)
      // A 404 is terminal (the run doesn't exist or isn't yours); otherwise the
      // error is likely transient, so keep polling.
      if (err instanceof ApiError && err.status === 404) {
        setIsPolling(false)
        return
      }
      timer.current = setTimeout(() => {
        scheduleNext.current()
      }, POLL_INTERVAL_MS)
    }
  }, [id])

  const refetch = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
    cancelled.current = false
    void poll()
  }, [poll])

  useEffect(() => {
    scheduleNext.current = () => void poll()
    cancelled.current = false
    // Defer the first poll out of the effect body so no setState runs
    // synchronously during commit (it would trigger a cascading render).
    timer.current = setTimeout(() => {
      scheduleNext.current()
    }, 0)
    return () => {
      cancelled.current = true
      if (timer.current !== null) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [poll])

  const phase = data ? derivePhase(data.status, data.current_step) : null

  return { data, phase, isLoading, isPolling, error, refetch }
}
