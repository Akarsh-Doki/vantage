import { expect, test } from "@playwright/test"
import { AWAITING, DONE, mockBackend, RESEARCHING, RUN_ID, signIn } from "./helpers"

test("new report runs through progress, review, and the finished report", async ({ page }) => {
  await mockBackend(page, [RESEARCHING, RESEARCHING, AWAITING])
  await signIn(page)

  // Create the report through the real form.
  await page.goto("/new")
  await page.getByLabel("Business name").fill("Blue Bottle Coffee")
  await page.getByLabel("Website").fill("https://bluebottle.example")
  await page.getByLabel("Industry").fill("Specialty coffee")
  await page.getByRole("button", { name: "Generate full report" }).click()

  // Progress: the polling stepper is live on the run page.
  await page.waitForURL(`**/reports/${RUN_ID}`)
  await expect(page.getByRole("heading", { name: "Building your campaign" })).toBeVisible()
  await expect(page.getByText("Reading competitor sites")).toBeVisible()

  // The run pauses at the human gate; the review panel appears via polling.
  await expect(
    page.getByRole("heading", { name: "Your draft is ready for approval" }),
  ).toBeVisible({ timeout: 15_000 })
  await page.getByRole("button", { name: "Approve and finish" }).click()

  // Approval flips the mock to completed; the finished report renders with
  // the same components as the public sample.
  await expect(
    page.getByRole("heading", { name: "Blue Bottle Coffee", exact: true }),
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText("The read on your market")).toBeVisible()
  await expect(page.getByText("The True Cost Cup")).toBeVisible()
  await expect(page.getByText("Coffee Retail Trade Study").first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Export PDF" }).first()).toBeVisible()
  // The AI disclosure sits under the header on every rendered report.
  await expect(page.getByText("AI-generated. Review before acting on it.")).toBeVisible()
  // The quality gate's internals never reach the customer: no warning labels,
  // and no raw rubric numbers presented as a grade.
  await expect(page.getByText(/below the quality bar/i)).toHaveCount(0)
  await expect(page.getByText(/\d\.\d \/ 10/)).toHaveCount(0)
})

test("a completed report opens directly from its URL", async ({ page }) => {
  await mockBackend(page, [DONE])
  await signIn(page)

  await page.goto(`/reports/${RUN_ID}`)

  await expect(
    page.getByRole("heading", { name: "Blue Bottle Coffee", exact: true }),
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: /campaigns you could start Monday/ })).toBeVisible()
})
