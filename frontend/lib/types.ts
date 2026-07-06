/**
 * TypeScript mirror of the FastAPI contract (backend/app/schemas.py).
 * The backend is the source of truth — keep in sync.
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
      return "researching" // research:* or not yet set — first running phase
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

/** One deliverable. The backend field for concepts is `creative`. */
export interface ReportResult {
  brief: Record<string, unknown> | null
  strategy: Record<string, unknown> | null
  creative: Record<string, unknown>[] | null
  sources: string[] | null
}

/** GET /reports/{id} */
export interface Report {
  run_id: string
  kind: string
  status: BackendRunStatus
  current_step: string | null
  error: string | null
  /** present only when status === "completed" */
  report: ReportResult | null
}

export interface ReportSummary {
  run_id: string
  kind: string
  status: BackendRunStatus
  current_step: string | null
  created_at: string | null
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

/** POST /sample — free reduced report, one per free user */
export interface SampleResponse {
  preview: boolean
  upgrade_hint: string
  result: Record<string, unknown>
}
