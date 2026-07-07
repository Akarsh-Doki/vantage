"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Session, SupabaseClient, User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface AuthContextValue {
  user: User | null
  session: Session | null
  /** true until the initial session lookup resolves */
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** sends the password-recovery email; resolves for unknown emails too */
  resetPassword: (email: string) => Promise<void>
  /** sets a new password on the current (recovery) session */
  updatePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazily create the client so a missing env var surfaces as a readable error
  // on first auth use, not a crash while rendering public pages.
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let client: SupabaseClient
    try {
      client = getSupabaseBrowserClient()
    } catch (err) {
      console.warn(err instanceof Error ? err.message : err)
      setLoading(false)
      return
    }
    setSupabase(client)

    client.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const requireClient = (): SupabaseClient => {
      if (!supabase) return getSupabaseBrowserClient() // throws the readable config error
      return supabase
    }
    return {
      user: session?.user ?? null,
      session,
      loading,
      signInWithGoogle: async () => {
        const { error } = await requireClient().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
        })
        if (error) throw new Error(error.message)
      },
      signInWithPassword: async (email, password) => {
        const { error } = await requireClient().auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
      },
      signUp: async (email, password) => {
        const { error } = await requireClient().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
        })
        if (error) throw new Error(error.message)
      },
      signOut: async () => {
        const { error } = await requireClient().auth.signOut()
        if (error) throw new Error(error.message)
      },
      resetPassword: async (email) => {
        // Current origin, never a hardcoded domain, so the same code works on
        // localhost and production. The link goes through /auth/callback so
        // the recovery code is exchanged into a cookie session server-side,
        // then lands on /reset-password.
        const { error } = await requireClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        })
        if (error) throw new Error(error.message)
      },
      updatePassword: async (password) => {
        const { error } = await requireClient().auth.updateUser({ password })
        if (error) throw new Error(error.message)
      },
    }
  }, [supabase, session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
