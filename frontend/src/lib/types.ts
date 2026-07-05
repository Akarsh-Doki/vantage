// TypeScript mirror of the backend API contract (app/schemas.py). Keep in sync.

export type RunStatusValue = 'queued' | 'running' | 'awaiting_review' | 'completed' | 'failed'

/**
 * Product-facing phase derived from `status` + `current_step`. The backend
 * keeps `status` in a small enum and rides the finer phases in `current_step`
 * (research:* / generating:* / finalizing / done); the UI collapses those into
 * this ordered lifecycle.
 */
export type ReportPhase =
  'queued' | 'researching' | 'awaiting_review' | 'generating' | 'done' | 'failed'

export interface ReportPayload {
  brief: Record<string, unknown> | null
  strategy: Record<string, unknown> | null
  creative: Record<string, unknown>[] | null
  sources: string[] | null
}

export interface RunStatus {
  run_id: string
  kind: string
  status: RunStatusValue
  current_step: string | null
  error: string | null
  report: ReportPayload | null
}

export interface RunCreated {
  run_id: string
  status: RunStatusValue
}

export interface RunSummary {
  run_id: string
  kind: string
  status: RunStatusValue
  current_step: string | null
  created_at: string | null
}

export interface RunListResponse {
  runs: RunSummary[]
}

// Enum option values accepted by POST /reports.
export type BusinessType =
  | 'local_service'
  | 'restaurant'
  | 'ecommerce_dtc'
  | 'startup_saas'
  | 'b2b'
  | 'creator_personal_brand'

export type Goal =
  | 'awareness'
  | 'foot_traffic'
  | 'lead_generation'
  | 'product_launch'
  | 'loyalty_retention'
  | 'virality'
  | 'trust_credibility'

export type Budget = 'zero' | 'low' | 'medium' | 'high'

export interface ReportRequest {
  business_name: string
  business_description?: string
  industry: string
  business_type: BusinessType
  goal: Goal
  budget: Budget
  website_url: string
  competitor_urls?: string[]
}
