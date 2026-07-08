import type { Page } from "@playwright/test"

/** The mocked FastAPI origin; every call to it is fulfilled by page.route. */
export const API = "http://127.0.0.1:8788"

export const RUN_ID = "22222222-2222-4222-8222-222222222222"

/** Sign in through the real UI against the local Supabase auth emulator. */
export async function signIn(page: Page): Promise<void> {
  await page.goto("/login")
  await page.getByLabel("Email").fill("e2e@vantage.test")
  await page.getByLabel("Password").fill("password-123")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await page.waitForURL("**/dashboard")
}

const base = {
  run_id: RUN_ID,
  kind: "full",
  error: null,
  name: "Blue Bottle Coffee",
  business_name: "Blue Bottle Coffee",
  created_at: "2026-07-07T12:00:00+00:00",
  report: null as unknown,
}

export const RESEARCHING = { ...base, status: "running", current_step: "research:competitor" }
export const AWAITING = { ...base, status: "awaiting_review", current_step: "awaiting_review" }

/** A completed run with the real structured deliverable schema. */
export const DONE = {
  ...base,
  status: "completed",
  current_step: "done",
  report: {
    brief: {
      headline: "Blue Bottle: own the honest cup",
      paragraphs: [{ text: "Competitors sell romance, not receipts.", cites: [1] }],
      tiles: [
        { label: "Gap", value: "The honest cup", detail: "Unclaimed" },
        { label: "Priority", value: "Short video", detail: "Lead channel" },
      ],
    },
    strategy: {
      paragraphs: [{ text: "Lead with the receipt in every channel.", cites: [1] }],
      positioning: {
        statement: "For coffee drinkers who want receipts, Blue Bottle is the honest cup.",
        tagline: "The honest cup",
      },
      channels: {
        items: [
          { name: "Short-form video", weight: 60, rationale: "proof" },
          { name: "Email", weight: 40, rationale: "cadence" },
        ],
      },
    },
    creative: [
      { title: "The True Cost Cup", score: 8.4 },
      { title: "Receipts, Weekly", score: 7.9 },
      { title: "The Open Ledger", score: 7.6 },
    ].map((c) => ({
      ...c,
      mechanism_id: "distinctive_asset_proof",
      current_trend_used: "receipt-style transparency posts",
      grounded_in: "https://adweek.example/study",
      source_n: 1,
      execution: "Film the real cost breakdown and post it as a carousel.",
      why_ownable: "Only Blue Bottle can show these numbers.",
      format: "Instagram carousel",
      budget_fit: "Zero spend",
    })),
    sources: [{ n: 1, title: "Coffee Retail Trade Study", url: "https://adweek.example/study" }],
  },
}

/** Wire the whole backend API for one test. Poll responses advance from
 * `phases` one GET at a time (the last repeats); approve flips to DONE. */
export async function mockBackend(
  page: Page,
  phases: Array<typeof RESEARCHING | typeof AWAITING | typeof DONE>,
): Promise<void> {
  let polls = 0
  let approved = false
  await page.route(`${API}/reports`, async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 202, json: { run_id: RUN_ID, status: "queued" } })
      return
    }
    await route.fulfill({ json: { runs: [] } })
  })
  await page.route(`${API}/reports/${RUN_ID}`, async (route) => {
    const body = approved ? DONE : (phases[Math.min(polls, phases.length - 1)] ?? DONE)
    polls += 1
    await route.fulfill({ json: body })
  })
  await page.route(`${API}/reports/${RUN_ID}/approve`, async (route) => {
    approved = true
    await route.fulfill({ json: { run_id: RUN_ID, status: "running" } })
  })
}
