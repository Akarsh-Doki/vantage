"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api, ApiError } from "@/lib/api"
import { deriveReportStatus, type Report, type ReportStatus } from "@/lib/types"

const POLL_INTERVAL_MS = 2000

/** Auth/ownership failures won't heal by retrying, so stop the poll on these. */
const TERMINAL_HTTP_STATUSES = new Set([401, 403, 404])

export interface PollReportResult {
  report: Report | null
  /** Product-facing status derived from the backend status + current_step. */
  status: ReportStatus | null
  /** True until the first response (success or error) lands. */
  isLoading: boolean
  /** True while the 2s poll is still running (stops on done/failed/auth errors). */
  isPolling: boolean
  error: string | null
  /** Poll again immediately and keep going, e.g. right after an approve. */
  refetch: () => void
}

/**
 * Poll GET /reports/{id} every 2s, walking the run through
 * queued -> researching -> awaiting_review -> generating -> done | failed.
 * Polling stops at the terminal states and on 401/403/404. Transient
 * network/5xx errors are surfaced but keep retrying. Cleans up on unmount.
 */
export function usePollReport(id: string | undefined): PollReportResult {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPolling, setIsPolling] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelled = useRef(false)
  // Holds the latest `poll` so the recursive setTimeout never has to reference
  // `poll` from inside its own definition. Wired up in the effect below.
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
      const next = await api.getReport(id)
      if (cancelled.current) return
      setReport(next)
      setError(null)
      setIsLoading(false)
      const status = deriveReportStatus(next.status, next.current_step)
      if (status === "done" || status === "failed") {
        setIsPolling(false)
        return
      }
      timer.current = setTimeout(() => {
        scheduleNext.current()
      }, POLL_INTERVAL_MS)
    } catch (err) {
      if (cancelled.current) return
      setError(err instanceof Error ? err.message : "Failed to load the report.")
      setIsLoading(false)
      if (err instanceof ApiError && TERMINAL_HTTP_STATUSES.has(err.status)) {
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

  const status = report ? deriveReportStatus(report.status, report.current_step) : null

  return { report, status, isLoading, isPolling, error, refetch }
}
