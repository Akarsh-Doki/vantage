"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowRight, Download, FileWarning, Pencil, RotateCw } from "lucide-react"
import { AppHeader } from "@/components/app/app-header"
import { PipelineStepper } from "@/components/app/pipeline-stepper"
import { RenameDialog } from "@/components/app/rename-dialog"
import { ReviewPanel } from "@/components/app/review-panel"
import { StatusBadge } from "@/components/app/status-badge"
import { ReportView } from "@/components/report/report-view"
import { SampleUpsell } from "@/components/report/sample-upsell"
import { usePollReport } from "@/hooks/use-poll-report"
import { api } from "@/lib/api"
import { toReportData } from "@/lib/report-adapter"
import type { ReportStatus } from "@/lib/types"
import { formatReportDate, pdfFileName } from "@/lib/utils"

const TITLES: Record<ReportStatus, string> = {
  queued: "Building your campaign",
  researching: "Building your campaign",
  generating: "Writing your campaign",
  awaiting_review: "Ready for your review",
  done: "Your campaign is ready",
  failed: "This run failed",
}

function reassurance(status: ReportStatus, currentStep: string | null, kind: string): string {
  const sample = kind === "sample"
  switch (status) {
    case "queued":
      return "Your report is queued. The pipeline will pick it up in a moment."
    case "researching":
      return sample
        ? "The agents are reading your competitors right now. This takes a couple of minutes, and it is safe to leave this page and come back."
        : "The agents are researching your market and competitors right now. This usually takes a few minutes, and it is safe to leave this page and come back."
    case "generating":
      if (currentStep === "finalizing") {
        return sample
          ? "Almost there. Your sample is being assembled now."
          : "The final report is being assembled now."
      }
      return sample
        ? "Research is done. Your competitive read and campaign concept are being written."
        : "Research is done. The strategist and creative director are drafting and scoring your campaign."
    case "awaiting_review":
      return "The draft is complete and the pipeline is paused. Review it below; nothing final is generated until you approve."
    default:
      return ""
  }
}

function ProgressSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-24 rounded bg-tan/60 motion-safe:animate-pulse" />
      <div className="h-9 w-72 max-w-full rounded bg-tan/50 motion-safe:animate-pulse" />
      <div className="h-4 w-96 max-w-full rounded bg-tan/40 motion-safe:animate-pulse" />
      <div className="mt-8 h-40 rounded-[10px] border border-hairline bg-card motion-safe:animate-pulse" />
    </div>
  )
}

export default function ReportRunPage() {
  const { id } = useParams<{ id: string }>()
  const { report, status, isLoading, error, refetch } = usePollReport(id)

  const [submitting, setSubmitting] = useState(false)
  // Latched after a successful submit so the panel stays disabled until the
  // next poll reflects the resumed run (avoids a double-approve window).
  const [resumed, setResumed] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  // A rename saved here wins over whatever the last poll returned.
  const [nameOverride, setNameOverride] = useState<string | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const reportName = nameOverride ?? report?.name ?? null

  useEffect(() => {
    if (status !== "awaiting_review") setResumed(false)
  }, [status])

  const submitReview = async (approved: boolean, feedback: string) => {
    setSubmitting(true)
    setReviewError(null)
    try {
      await api.approveReport(id, { approved, feedback: feedback.trim() || null })
      setResumed(true)
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Could not submit your review.")
    } finally {
      setSubmitting(false)
      refetch() // reflect the new status right away (also heals a stale 409)
    }
  }

  // ----- finished, full and sample render with the same report components -----
  if (status === "done" && report?.report) {
    const isSample = report.kind === "sample"
    const data = toReportData(report.report, {
      kind: report.kind,
      name: reportName,
      createdAt: report.created_at,
    })
    // The browser names the saved PDF after document.title, so swap it in for
    // the duration of the print and restore it afterwards.
    const exportPdf = () => {
      const original = document.title
      document.title = pdfFileName(report.business_name, reportName ?? data.meta.business)
      const restore = () => {
        document.title = original
        window.removeEventListener("afterprint", restore)
      }
      window.addEventListener("afterprint", restore)
      window.print()
    }
    const exportButton = (
      <button
        type="button"
        onClick={exportPdf}
        className="inline-flex items-center gap-2 rounded-[10px] bg-forest px-4 py-2 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
      >
        <Download className="h-4 w-4" />
        Export PDF
      </button>
    )
    const renameButton = (
      <button
        type="button"
        onClick={() => setRenameOpen(true)}
        className="inline-flex items-center gap-2 rounded-[10px] border border-hairline bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
      >
        <Pencil className="h-4 w-4 text-muted-foreground" />
        Rename
      </button>
    )
    return (
      <>
      {renameOpen ? (
        <RenameDialog
          runId={id}
          initialName={reportName ?? data.meta.business}
          onClose={() => setRenameOpen(false)}
          onRenamed={setNameOverride}
        />
      ) : null}
      <ReportView
        data={data}
        badge={isSample ? "Sample report" : "Full report"}
        backHref="/dashboard"
        actions={
          <>
            {renameButton}
            {exportButton}
          </>
        }
        footer={
          <>
            {isSample ? <SampleUpsell /> : null}
            <footer className="report-action-bar border-t border-hairline py-14 text-center">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Generated by Vantage &middot; every claim cited
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {exportButton}
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-hairline bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
                >
                  Back to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </footer>
          </>
        }
      />
      </>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-16">
        {isLoading ? (
          <ProgressSkeleton />
        ) : !report ? (
          // First load failed outright (bad id, signed out, network down).
          <div className="rounded-[10px] border border-hairline bg-card px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-tan text-forest">
              <FileWarning className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-foreground">
              Could not load this report
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {error ?? "Something went wrong while loading this report."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={refetch}
                className="inline-flex items-center gap-2 rounded-[10px] bg-forest px-5 py-2.5 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
              >
                <RotateCw className="h-4 w-4" />
                Try again
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-[10px] border border-hairline bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : status === "failed" ? (
          <div className="rounded-[10px] border border-destructive/25 bg-card px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-destructive/10 text-destructive">
              <FileWarning className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-foreground">
              {TITLES.failed}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {report.error ?? "Something went wrong while generating your report. You were not charged for a failed run."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/new"
                className="inline-flex items-center gap-2 rounded-[10px] bg-forest px-5 py-2.5 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
              >
                Start a new report
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-[10px] border border-hairline bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : status ? (
          <>
            {renameOpen ? (
              <RenameDialog
                runId={id}
                initialName={reportName ?? ""}
                onClose={() => setRenameOpen(false)}
                onRenamed={setNameOverride}
              />
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-forest">Report</p>
                <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground">
                  {TITLES[status]}
                </h1>
                {reportName ? (
                  <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    {reportName}
                    <button
                      type="button"
                      onClick={() => setRenameOpen(true)}
                      aria-label="Rename report"
                      className="rounded-[6px] p-1 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-forest"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </p>
                ) : null}
              </div>
              <StatusBadge status={status} />
            </div>
            <p className="mt-3 max-w-[560px] text-sm leading-relaxed text-muted-foreground">
              {reassurance(status, report.current_step, report.kind)}
            </p>

            <div className="mt-8 rounded-[10px] border border-hairline bg-card p-6 md:p-8">
              <PipelineStepper status={status} currentStep={report.current_step} kind={report.kind} />
            </div>

            {status === "awaiting_review" ? (
              <div className="mt-6">
                <ReviewPanel
                  submitting={submitting || resumed}
                  error={reviewError}
                  onApprove={(feedback) => void submitReview(true, feedback)}
                  onRequestChanges={(feedback) => void submitReview(false, feedback)}
                />
              </div>
            ) : null}

            {status === "done" && !report.report ? (
              <p className="mt-6 rounded-[10px] border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                The run finished but the report content could not be loaded. Try refreshing this page.
              </p>
            ) : null}

            {error ? (
              <p className="mt-6 font-mono text-xs text-muted-foreground">
                Connection hiccup, retrying: {error}
              </p>
            ) : null}

            <p className="mt-10 font-mono text-[11px] text-muted-foreground">
              {report.kind === "sample" ? "Free sample" : "Full report"}
              {formatReportDate(report.created_at) ? (
                <> &middot; {formatReportDate(report.created_at)}</>
              ) : null}{" "}
              &middot; {report.run_id}
            </p>
          </>
        ) : null}
      </main>
    </div>
  )
}
