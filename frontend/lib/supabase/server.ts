import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

/**
 * Server Supabase client for Server Components and Route Handlers. Reads the
 * auth session from cookies. Anon key only, no service keys anywhere in the
 * frontend.
 */
export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local (see .env.local.example).",
    )
  }
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component where cookies are read-only; the
          // middleware refreshes sessions, so this is safe to ignore.
        }
      },
    },
  })
}
