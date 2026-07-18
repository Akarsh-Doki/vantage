import { defineConfig, devices } from "@playwright/test"

/*
 * E2E runs against a dedicated dev server on port 3100 (so a developer's own
 * `next dev` on 3000 is untouched) with ALL network mocked. Supabase auth is
 * a tiny local emulator (e2e/mocks/supabase-mock.mjs, also used by the Next
 * middleware server-side) and every backend API call is intercepted per test
 * with page.route. Zero real Supabase, zero LLM/Tavily, zero spend.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/mocks/supabase-mock.mjs",
      url: "http://127.0.0.1:54321/health",
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
    {
      // Production build on purpose. Dev-mode HMR races hydration under the
      // test browser (a click before hydration submits forms natively).
      // NEXT_PUBLIC_* values are baked at build time, so they live here.
      command: "npm run build && npm run start -- -p 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key",
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:8788",
      },
    },
  ],
})
