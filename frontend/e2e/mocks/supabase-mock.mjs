// Minimal Supabase auth emulator for E2E runs. Serves just the GoTrue
// endpoints the app touches, so login works end to end (browser client AND
// the Next middleware's server-side getUser) with zero real network.
// Started by playwright.config.ts as a webServer on port 54321.
import { createServer } from "node:http"

const PORT = 54321
const USER = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "e2e@vantage.test",
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
}

// Unsigned but JWT-shaped. supabase-js decodes the payload, never verifies
// client-side. exp is far in the future so no refresh is attempted mid-test.
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url")
const ACCESS_TOKEN = `${b64({ alg: "none", typ: "JWT" })}.${b64({
  sub: USER.id,
  aud: "authenticated",
  role: "authenticated",
  email: USER.email,
  exp: 4102444800,
})}.e2e`

const session = () => ({
  access_token: ACCESS_TOKEN,
  token_type: "bearer",
  expires_in: 3600 * 24 * 365,
  expires_at: 4102444800,
  refresh_token: "e2e-refresh-token",
  user: USER,
})

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "*")
  res.setHeader("Access-Control-Allow-Methods", "*")
  if (req.method === "OPTIONS") {
    res.writeHead(204)
    return res.end()
  }
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  const json = (code, body) => {
    res.writeHead(code, { "Content-Type": "application/json" })
    res.end(JSON.stringify(body))
  }
  if (url.pathname === "/auth/v1/token") return json(200, session())
  if (url.pathname === "/auth/v1/user") return json(200, USER)
  if (url.pathname === "/auth/v1/logout") return json(204, {})
  if (url.pathname === "/health" || url.pathname === "/auth/v1/health") {
    return json(200, { ok: true })
  }
  return json(404, { error: "not mocked", path: url.pathname })
})

server.listen(PORT, "127.0.0.1", () => {
  console.log(`supabase mock listening on ${PORT}`)
})
