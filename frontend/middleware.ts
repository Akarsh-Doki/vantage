import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Auth middleware: keeps the Supabase session cookies fresh on every request
 * and gates the app routes behind sign-in.
 *
 * Public: / , /login, /report (the sample), /auth/* (OAuth callback).
 * Protected: /dashboard, /new, /reports (a user's own reports & progress).
 */
const PROTECTED_PREFIXES = ["/dashboard", "/new", "/reports"]

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fail closed: without Supabase config nobody can be authenticated, so
  // protected routes behave as logged-out and public routes work normally.
  if (!url || !anonKey) {
    if (isProtected(pathname)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/login"
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // getUser() validates the JWT with Supabase (unlike getSession, which only
  // reads the cookie), which is required for a trustworthy auth check.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  // Run everywhere except static assets so session cookies stay refreshed.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|images/|.*\\.(?:svg|png|jpg|jpeg|webp|woff2?)$).*)"],
}
