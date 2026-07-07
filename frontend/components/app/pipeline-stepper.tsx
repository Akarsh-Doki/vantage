import { Check, X } from "lucide-react"
import type { ReportStatus } from "@/lib/types"

/*
 * Timeline of the agent pipeline for the progress screen. Stages collapse the
 * backend's finer current_step values (planning, research:*, synthesis,
 * strategy, generating:*, awaiting_review, finalizing) into calm steps.
 * Sample runs skip the reviewer and the human gate, so their timeline has no
 * Review stage. All motion is behind motion-safe so prefers-reduced-motion
 * gets a static view.
 */

type StageKey = "research" | "synthesis" | "strategy" | "creative" | "review" | "done"

const FULL_STAGES: { key: StageKey; label: string }[] = [
  { key: "research", label: "Research" },
  { key: "synthesis", label: "Synthesis" },
  { key: "strategy", label: "Strategy" },
  { key: "creative", label: "Creative" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
]
const SAMPLE_STAGES = FULL_STAGES.filter((stage) => stage.key !== "review")

/** Human line for the backend's fine-grained step, shown under the active stage. */
const STEP_DETAIL: Record<string, string> = {
  planning: "Planning the research",
  "research:competitor": "Reading competitor sites",
  "research:audience": "Profiling the audience",
  "research:market": "Scanning market trends",
  synthesis: "Synthesizing the brief",
  strategy: "Drafting the strategy",
  "generating:concepts": "Generating creative concepts",
  "generating:review": "Scoring concepts against the rubric",
  awaiting_review: "Paused for your approval",
  finalizing: "Assembling the final report",
}

function activeStageKey(status: ReportStatus, currentStep: string | null): StageKey | "all" {
  if (status === "done") return "all" // everything complete
  if (status === "awaiting_review") return "review"
  const step = currentStep ?? ""
  if (step === "synthesis") return "synthesis"
  if (step === "strategy") return "strategy"
  if (step.startsWith("generating")) return "creative"
  if (step === "awaiting_review") return "review"
  if (step === "finalizing" || step === "done") return "done"
  return "research" // queued, planning, research:*
}

type StageState = "complete" | "active" | "failed" | "upcoming"

function Circle({ state }: { state: StageState }) {
  if (state === "complete") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-forest-foreground">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    )
  }
  if (state === "active") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-forest bg-card">
        <span className="h-2 w-2 rounded-full bg-forest motion-safe:animate-pulse" />
      </span>
    )
  }
  if (state === "failed") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-destructive bg-card text-destructive">
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    )
  }
  return <span className="h-7 w-7 shrink-0 rounded-full border border-hairline bg-card" />
}

const LABEL_CLASS: Record<StageState, string> = {
  complete: "text-foreground/70",
  active: "font-medium text-forest",
  failed: "font-medium text-destructive",
  upcoming: "text-muted-foreground/70",
}

export function PipelineStepper({
  status,
  currentStep,
  kind = "full",
}: {
  status: ReportStatus
  currentStep: string | null
  /** "sample" renders the shorter timeline without the Review stage */
  kind?: string
}) {
  const stages = kind === "sample" ? SAMPLE_STAGES : FULL_STAGES
  const key = activeStageKey(status, currentStep)
  const active = key === "all" ? stages.length : Math.max(stages.findIndex((s) => s.key === key), 0)
  const detail = status === "done" ? null : (STEP_DETAIL[currentStep ?? ""] ?? null)

  return (
    <ol aria-label="Report pipeline" className="flex flex-col sm:flex-row">
      {stages.map((stage, i) => {
        const state: StageState =
          i < active ? "complete" : i === active ? (status === "failed" ? "failed" : "active") : "upcoming"
        const isLast = i === stages.length - 1
        return (
          <li
            key={stage.key}
            aria-current={state === "active" ? "step" : undefined}
            className="relative flex items-start gap-3 pb-7 last:pb-0 sm:flex-1 sm:flex-col sm:items-center sm:gap-2.5 sm:pb-0 sm:text-center"
          >
            {!isLast ? (
              <span
                aria-hidden
                className={`absolute left-3.5 top-8 h-[calc(100%-2.25rem)] w-px sm:left-[calc(50%+22px)] sm:right-[calc(-50%+22px)] sm:top-3.5 sm:h-px sm:w-auto ${
                  i < active ? "bg-forest/40" : "bg-hairline"
                }`}
              />
            ) : null}
            <Circle state={state} />
            <div className="min-w-0 pt-1 sm:pt-0">
              <p className={`font-mono text-[11px] uppercase tracking-wider ${LABEL_CLASS[state]}`}>{stage.label}</p>
              {state === "active" && detail ? (
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{detail}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
