"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, FileText, Pencil, Trash2, X } from "lucide-react"
import { AppHeader } from "@/components/app/app-header"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { StatusBadge } from "@/components/app/status-badge"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { deriveReportStatus, type ReportSummary } from "@/lib/types"

function formatDate(iso: string | null): string {
  if (!iso) return "…"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "…"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function kindLabel(kind: string): string {
  return kind === "sample" ? "Free sample" : "Full report"
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[10px] border border-hairline bg-card p-5">
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-40 rounded bg-tan/60 motion-safe:animate-pulse" />
        <div className="h-3 w-56 rounded bg-tan/40 motion-safe:animate-pulse" />
      </div>
      <div className="h-6 w-24 rounded-full bg-tan/50 motion-safe:animate-pulse" />
    </div>
  )
}

export default function DashboardPage() {
  const [reports, setReports] = useState<ReportSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [renaming, setRenaming] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ReportSummary | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await api.listReports()
      setReports(res.runs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your reports.")
      setReports((prev) => prev ?? [])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const startRename = (run: ReportSummary) => {
    setEditingId(run.run_id)
    setDraftName(run.name ?? kindLabel(run.kind))
  }

  const saveRename = async (id: string) => {
    const name = draftName.trim()
    if (!name || renaming) return
    setRenaming(true)
    setError(null)
    const previous = reports
    // Optimistic update. Show the new name immediately, revert if the save fails.
    setReports((prev) => (prev ?? []).map((r) => (r.run_id === id ? { ...r, name } : r)))
    setEditingId(null)
    try {
      await api.renameReport(id, name)
    } catch (err) {
      setReports(previous)
      setError(err instanceof Error ? err.message : "Could not rename the report.")
    } finally {
      setRenaming(false)
    }
  }

  // Confirmation happens in the in-app ConfirmDialog, never window.confirm.
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setError(null)
    const previous = reports
    setReports((prev) => (prev ?? []).filter((r) => r.run_id !== id))
    try {
      await api.deleteReport(id)
    } catch (err) {
      setReports(previous) // revert the optimistic removal
      setError(err instanceof Error ? err.message : "Could not delete the report.")
    } finally {
      setDeletingId(null)
    }
  }

  const loading = reports === null && !error

  return (
    <div className="min-h-svh bg-background">
      {deleteTarget ? (
        <ConfirmDialog
          title="Delete this report?"
          body={`"${deleteTarget.name ?? kindLabel(deleteTarget.kind)}" will be deleted. This cannot be undone.`}
          confirmLabel="Delete report"
          busy={deletingId === deleteTarget.run_id}
          onConfirm={() => {
            const id = deleteTarget.run_id
            setDeleteTarget(null)
            void handleDelete(id)
          }}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-forest">Workspace</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground">Your reports</h1>
          </div>
          {reports && reports.length > 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              {reports.length} {reports.length === 1 ? "report" : "reports"}
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="mt-6 rounded-[10px] border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : null}

          {reports && reports.length === 0 && !error ? (
            <div className="rounded-[10px] border border-hairline bg-card px-6 py-14 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-tan text-forest">
                <FileText className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-serif text-xl font-semibold tracking-tight text-foreground">
                No reports yet
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Tell us about your business and the agent pipeline will research, plan, and write your
                first campaign.
              </p>
              <Link
                href="/new"
                className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-forest px-5 py-2.5 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
              >
                Create your first report
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}

          {reports?.map((run) => {
            const status = deriveReportStatus(run.status, run.current_step)
            const editing = editingId === run.run_id
            return (
              <div
                key={run.run_id}
                className="group flex items-center gap-4 rounded-[10px] border border-hairline bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {editing ? (
                  <div className="min-w-0 flex-1">
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void saveRename(run.run_id)
                      }}
                    >
                      <Input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        maxLength={120}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingId(null)
                        }}
                        aria-label="Report name"
                        className="h-10 max-w-md rounded-[10px] border-hairline bg-background font-serif text-lg"
                      />
                      <button
                        type="submit"
                        disabled={renaming || draftName.trim().length === 0}
                        aria-label="Save name"
                        className="rounded-[10px] bg-forest p-2 text-forest-foreground transition-colors hover:bg-forest-hover disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancel rename"
                        className="rounded-[10px] border border-hairline p-2 text-muted-foreground transition-colors hover:bg-secondary/60"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </form>
                    <p className="mt-1.5 truncate font-mono text-xs text-muted-foreground">
                      {kindLabel(run.kind)} · {formatDate(run.created_at)}
                    </p>
                  </div>
                ) : (
                  <Link href={`/reports/${run.run_id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="truncate font-serif text-lg font-semibold tracking-tight text-foreground">
                        {run.name ?? kindLabel(run.kind)}
                      </span>
                      <StatusBadge status={status} />
                    </div>
                    <p className="mt-1.5 truncate font-mono text-xs text-muted-foreground">
                      {kindLabel(run.kind)} · {formatDate(run.created_at)} · {run.run_id}
                    </p>
                  </Link>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  {!editing ? (
                    <button
                      type="button"
                      onClick={() => startRename(run)}
                      aria-label="Rename report"
                      className="rounded-[10px] p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-forest"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(run)}
                    disabled={deletingId === run.run_id}
                    aria-label="Delete report"
                    className="rounded-[10px] p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/reports/${run.run_id}`}
                    aria-label="Open report"
                    className="rounded-[10px] p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-forest"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
