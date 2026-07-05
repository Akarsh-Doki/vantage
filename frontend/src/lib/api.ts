import { supabase } from '@/lib/supabase'

// VITE_API_URL points at the FastAPI backend root (e.g. http://localhost:8000).
const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, '')

/** Thrown for any non-2xx response; `status` is the HTTP status (0 = network). */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function authHeaders(hasBody: boolean): Promise<Headers> {
  const headers = new Headers()
  if (hasBody) headers.set('Content-Type', 'application/json')
  // Read the *current* session on every request so a refreshed token is always
  // used; getSession() transparently refreshes an expired access token.
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const hasBody = body !== undefined
  const headers = await authHeaders(hasBody)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Network error — could not reach the server.')
  }

  if (!res.ok) {
    let detail = res.statusText || 'Request failed'
    try {
      const errBody = (await res.json()) as { detail?: unknown }
      if (typeof errBody.detail === 'string') detail = errBody.detail
    } catch {
      /* error body wasn't JSON — keep the status text */
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path, 'GET'),
  post: <T>(path: string, body?: unknown) => request<T>(path, 'POST', body),
  delete: <T>(path: string) => request<T>(path, 'DELETE'),
}
