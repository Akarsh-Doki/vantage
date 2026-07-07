/**
 * TypeScript mirror of the FastAPI contract (backend/app/schemas.py).
 * The backend is the source of truth. Keep in sync.
 */

// ---------- enums the backend accepts ----------

export type BusinessType =
  | "local_service"
  | "restaurant"
  | "ecommerce_dtc"
  | "startup_saas"
  | "b2b"
  | "creator_personal_brand"

export type Goal =
  | "awareness"
  | "foot_traffic"
  | "lead_generation"
  | "product_launch"
  | "loyalty_retention"
  | "virality"
  | "trust_credibility"

export type Budget = "zero" | "low" | "medium" | "high"

// ---------- run lifecycle ----------

/** Raw status stored by the backend (report_runs CHECK enum). */
export type BackendRunStatus = "queued" | "running" | "awaiting_review" | "completed" | "failed"

/**
 * Product-facing status shown in the UI. The backend keeps `status` in a small
 * enum and rides finer phases in `current_step` (research:* / generating:* /
 * finalizing / done); `deriveReportStatus` collapses the pair into this.
 */
export type ReportStatus =
  | "queued"
  | "researching"
  | "awaiting_review"
  | "generating"
  | "done"
  | "failed"

export function deriveReportStatus(
  status: BackendRunStatus | string,
  currentStep: string | null,
): ReportStatus {
  switch (status) {
    case "queued":
      return "queued"
    case "awaiting_review":
      return "awaiting_review"
    case "completed":
      return "done"
    case "failed":
      return "failed"
    case "running": {
      const step = currentStep ?? ""
      if (step.startsWith("generating") || step === "finalizing") return "generating"
      return "researching" // research:* or not yet set, the first running phase
    }
    default:
      return "queued"
  }
}

// ---------- request / response shapes ----------

export interface ReportInput {
  business_name: string
  business_description?: string
  industry: string
  business_type: BusinessType
  goal: Goal
  budget: Budget
  website_url: string
  competitor_urls?: string[]
}

/** POST /reports and POST /reports/{id}/approve → 202/200 */
export interface RunCreated {
  run_id: string
  status: BackendRunStatus
}

// ---------- the structured deliverable ----------
// Mirror of what backend finalize() assembles (backend/app/graph.py): plain
// prose sections that cite the numbered sources list by n, never markdown or
// inline "[source: url]" text. Legacy rows from before this schema may still
// hold {text: string} sections and string[] sources; lib/report-adapter.ts
// converts those.

/** One plain-prose paragraph; cites holds the n values of its sources. */
export interface CitedParagraphPayload {
  text: string
  cites: number[]
}

/** One entry in the numbered citation list. */
export interface SourcePayload {
  n: number
  title: string
  url: string
}

export interface BriefPayload {
  /** short report title, e.g. "Ridgeline: own the roast date" */
  headline?: string
  paragraphs: CitedParagraphPayload[]
}

export interface StrategyPayload {
  paragraphs: CitedParagraphPayload[]
}

/** One creative concept; source_n points into the numbered sources list. */
export interface ConceptPayload {
  title: string
  mechanism_id: string
  current_trend_used?: string
  grounded_in?: string
  source_n?: number
  execution: string
  why_ownable?: string
  format?: string
  budget_fit?: string
  score?: number
  below_bar?: boolean
}

/** One deliverable. The backend field for concepts is `creative`. */
export interface ReportResult {
  brief: Record<string, unknown> | null
  strategy: Record<string, unknown> | null
  creative: Record<string, unknown>[] | null
  /** SourcePayload[] on current rows; string[] on legacy rows */
  sources: unknown[] | null
}

/** GET /reports/{id} */
export interface Report {
  run_id: string
  kind: string
  status: BackendRunStatus
  current_step: string | null
  error: string | null
  /** user-chosen name, falling back to the project's business name */
  name: string | null
  /** present only when status === "completed" */
  report: ReportResult | null
}

export interface ReportSummary {
  run_id: string
  kind: string
  status: BackendRunStatus
  current_step: string | null
  created_at: string | null
  /** user-chosen name, falling back to the project's business name */
  name: string | null
}

/** PATCH /reports/{id} */
export interface RenameResponse {
  run_id: string
  name: string
}

/** GET /reports */
export interface ReportListResponse {
  runs: ReportSummary[]
}

/** DELETE /reports/{id} */
export interface DeleteResponse {
  run_id: string
  deleted: boolean
}

export interface ApproveInput {
  approved: boolean
  feedback?: string | null
}
