"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

/*
 * Shown while the run is awaiting_review. The draft itself stays inside the
 * paused pipeline (the API returns the deliverable only once completed), so
 * this panel explains what was produced and gates the final generation on the
 * user's approval. Approve resumes the run; notes send it back for revision.
 */

const PRODUCED = [
  "Market, competitor, and audience research with every claim cited",
  "A positioning brief and a channel-level strategy drafted from that research",
  "Creative concepts scored against the Vantage rubric by the automated reviewer",
]

export function ReviewPanel({
  submitting,
  error,
  onApprove,
  onRequestChanges,
}: {
  submitting: boolean
  error: string | null
  onApprove: (feedback: string) => void
  onRequestChanges: (feedback: string) => void
}) {
  const [feedback, setFeedback] = useState("")
  const hasFeedback = feedback.trim().length > 0

  return (
    <section
      aria-label="Review your campaign"
      className="rounded-[10px] border border-forest/25 bg-card p-6 md:p-8"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-forest">Human review</p>
      <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
        Your draft is ready for approval
      </h2>
      <p className="mt-3 max-w-[560px] text-sm leading-relaxed text-muted-foreground">
        The pipeline pauses here on purpose. Nothing final is generated until you approve it.
        So far the agents have produced:
      </p>

      <ul className="mt-5 space-y-2.5">
        {PRODUCED.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90">
            <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-forest/10">
              <Check className="h-3 w-3 text-forest" strokeWidth={2.5} />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <label htmlFor="review-feedback" className="text-sm font-medium text-foreground">
          Notes for revision <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="review-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          disabled={submitting}
          rows={3}
          maxLength={2000}
          placeholder="Lean more local, drop the discount angle…"
          className="mt-2 w-full resize-y rounded-[10px] border border-hairline bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-[10px] border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          disabled={submitting}
          onClick={() => onApprove(feedback)}
          className="h-11 rounded-[10px] bg-forest px-6 text-sm font-medium text-forest-foreground hover:bg-forest-hover"
        >
          {submitting ? "Submitting…" : "Approve and finish"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={submitting || !hasFeedback}
          onClick={() => onRequestChanges(feedback)}
          className="h-11 rounded-[10px] border-hairline px-6 text-sm font-medium"
        >
          Request changes
        </Button>
      </div>
      <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        Approve resumes the pipeline and assembles the final report. Request changes sends your
        notes back to the creative team for another pass.
      </p>
    </section>
  )
}
