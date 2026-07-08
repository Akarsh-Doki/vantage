import { expect, test } from "@playwright/test"
import { API, signIn } from "./helpers"

test("logs in and lands on the dashboard", async ({ page }) => {
  await page.route(`${API}/reports`, (route) => route.fulfill({ json: { runs: [] } }))

  await signIn(page)

  // Past the middleware auth wall, onto the real dashboard.
  await expect(page.getByRole("heading", { name: "Your reports" })).toBeVisible()
  await expect(page.getByText("No reports yet")).toBeVisible()
  await expect(page.getByRole("link", { name: "Create your first report" })).toBeVisible()
})

test("unauthenticated visitors are redirected to login", async ({ page }) => {
  await page.goto("/dashboard")
  await page.waitForURL("**/login**")
  await expect(page.getByRole("heading", { name: "Welcome to Vantage" })).toBeVisible()
})
