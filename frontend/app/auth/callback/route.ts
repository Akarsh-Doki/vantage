import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

/**
 * OAuth / email-confirmation callback. Supabase redirects here with a PKCE
 * `code`. We exchange it for a session (stored in cookies) and forward the
 * user on. `next` is restricted to same-origin paths to prevent open redirects.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next") ?? "/dashboard"
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard"

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Password-recovery links that failed verification (expired, already used)
  // arrive without a usable code. Show the reset page's clean invalid-link
  // state instead of a silent login error.
  if (next.startsWith("/reset-password")) {
    return NextResponse.redirect(`${origin}/reset-password?error=link`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
