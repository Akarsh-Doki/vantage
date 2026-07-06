import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type {
  ApproveInput,
  DeleteResponse,
  Report,
  ReportInput,
  ReportListResponse,
  RunCreated,
  SampleResponse,
} from "@/lib/types"

/** Any non-2xx backend response. `status` is the HTTP status (0 = network). */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

/**
 * 402 from the backend: the user's plan doesn't cover this action (e.g. full
 * report on a free account, or the one free sample already used). The backend
 * is the source of truth for paid/free — the client only reacts to this error,
 * it never decides access itself.
 */
export class PaymentRequiredError extends ApiError {
  constructor(message: string) {
    super(402, message)
    this.name = "PaymentRequiredError"
  }
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_API_URL — set it in frontend/.env.local (see .env.local.example).")
  }
  return url.replace(/\/+$/, "")
}

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  // Read the session fresh on every call so a refreshed access token is always
  // used; getSession() transparently refreshes an expired one.
  const supabase = getSupabaseBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers()
  if (body !== undefined) headers.set("Content-Type", "application/json")
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`)

  let res: Response
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, "Network error — could not reach the server.")
  }

  if (!res.ok) {
    let detail = res.statusText || "Request failed"
    try {
      const errBody = (await res.json()) as { detail?: unknown }
      if (typeof errBody.detail === "string") detail = errBody.detail
    } catch {
      // error body wasn't JSON — keep the status text
    }
    if (res.status === 402) throw new PaymentRequiredError(detail)
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  /** POST /reports — may throw PaymentRequiredError on free accounts. */
  createReport: (input: ReportInput) => request<RunCreated>("/reports", "POST", input),

  /** GET /reports */
  listReports: () => request<ReportListResponse>("/reports", "GET"),

  /** GET /reports/{id} — status + result when completed. */
  getReport: (id: string) => request<Report>(`/reports/${encodeURIComponent(id)}`, "GET"),

  /** POST /reports/{id}/approve */
  approveReport: (id: string, input: ApproveInput = { approved: true }) =>
    request<RunCreated>(`/reports/${encodeURIComponent(id)}/approve`, "POST", input),

  /** DELETE /reports/{id} */
  deleteReport: (id: string) => request<DeleteResponse>(`/reports/${encodeURIComponent(id)}`, "DELETE"),

  /** POST /sample — free reduced report; PaymentRequiredError once used. */
  createSample: (input: ReportInput) => request<SampleResponse>("/sample", "POST", input),
}
