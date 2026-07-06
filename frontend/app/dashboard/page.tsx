"use client"

// TODO: placeholder only — the real dashboard UI is built in a separate task.
// This page exists so the auth foundation (login → land here, logged-out →
// redirected by middleware) is verifiable end to end.

import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-forest">Dashboard</p>
      <h1 className="font-serif text-3xl font-medium tracking-tight">
        {loading ? "Loading…" : `Signed in as ${user?.email ?? "unknown"}`}
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        Your workspace is being built. Reports, progress, and results will live here.
      </p>
      <Button
        variant="outline"
        onClick={() => void handleSignOut()}
        className="mt-2 rounded-[10px] border-hairline"
      >
        Sign out
      </Button>
    </main>
  )
}
