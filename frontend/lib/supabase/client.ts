import { createBrowserClient } from "@supabase/ssr"

/**
 * Browser Supabase client (singleton per tab). Uses only the public anon key;
 * RLS on the backend tables is what enforces access, never this client.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local (see .env.local.example).",
    )
  }
  return createBrowserClient(url, anonKey)
}
