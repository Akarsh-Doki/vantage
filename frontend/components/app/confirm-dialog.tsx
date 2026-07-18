"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

/*
 * In-app confirmation modal for destructive actions, replacing the browser's
 * native confirm(). Centered card on a subtle backdrop, serif title, sans
 * body, outline cancel, destructive confirm. Closes on cancel, backdrop
 * click, and Escape. Focus lands on Cancel so Enter never destroys by
 * accident. No native dialog is ever shown.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string
  body: string
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-foreground/20"
      />
      <div className="relative w-full max-w-sm rounded-[10px] border border-hairline bg-card p-6 shadow-md">
        <h2 id="confirm-dialog-title" className="font-serif text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 rounded-[10px] border-hairline px-4 text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-10 rounded-[10px] bg-destructive px-4 text-sm font-medium text-white hover:bg-destructive/90"
          >
            {busy ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
