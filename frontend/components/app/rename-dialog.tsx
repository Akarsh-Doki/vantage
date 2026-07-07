"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"

/*
 * Small centered rename modal. Saves on Enter or the forest button, closes on
 * Escape or the overlay, reports the saved name back so callers can update
 * their local state optimistically rendered views.
 */
export function RenameDialog({
  runId,
  initialName,
  onClose,
  onRenamed,
}: {
  runId: string
  initialName: string
  onClose: () => void
  onRenamed: (name: string) => void
}) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await api.renameReport(runId, trimmed)
      onRenamed(res.name)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename the report.")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-foreground/20"
      />
      <div className="relative w-full max-w-sm rounded-[10px] border border-hairline bg-card p-6 shadow-md">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-forest">Rename report</p>
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            placeholder="Report name"
            className="h-11 rounded-[10px] border-hairline bg-background"
          />
          {error ? <p className="mt-2 text-xs leading-snug text-destructive">{error}</p> : null}
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-[10px] border-hairline px-4 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || name.trim().length === 0}
              className="h-10 rounded-[10px] bg-forest px-4 text-sm font-medium text-forest-foreground hover:bg-forest-hover"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
