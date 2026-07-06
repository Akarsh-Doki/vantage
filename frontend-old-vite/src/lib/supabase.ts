import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Fail fast with a clear, actionable message rather than a cryptic runtime
  // crash deep inside an auth call. The anon key is public (RLS enforces
  // access), so this is config, not a secret.
  throw new Error(
    'Missing Supabase config — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local.',
  )
}

// Default options persist the session in localStorage, auto-refresh the access
// token, and pick up the session from the magic-link redirect URL.
export const supabase = createClient(url, anonKey)
