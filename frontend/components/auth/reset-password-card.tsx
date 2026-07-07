"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/providers/auth-provider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const MIN_PASSWORD_CHARS = 8
const SESSION_WAIT_MS = 3000

type Phase = "checking" | "ready" | "invalid" | "done"

/*
 * The page the recovery email lands on. The link goes through /auth/callback,
 * which exchanges the recovery code for a cookie session, so by the time this
 * mounts there is normally a session already; we also listen for the
 * PASSWORD_RECOVERY auth event (covers clients that deliver the token in the
 * URL) and read error params so expired links get a clean dead end, never a
 * broken form.
 */
export function ResetPasswordCard() {
  const { updatePassword } = useAuth()
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>("checking")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // An error in the query (?error=link from the callback) or the hash
    // (#error_code=otp_expired straight from Supabase) means the link is dead.
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const queryParams = new URLSearchParams(window.location.search)
    if (hashParams.get("error") || queryParams.get("error")) {
      setPhase("invalid")
      return
    }

    let client
    try {
      client = getSupabaseBrowserClient()
    } catch {
      setPhase("invalid")
      return
    }

    const becomeReady = () => {
      setPhase((current) => (current === "checking" ? "ready" : current))
    }

    void client.auth.getSession().then(({ data }) => {
      if (data.session) becomeReady()
    })
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) becomeReady()
    })
    // No session after a fair wait: the link never established one.
    const timer = setTimeout(() => {
      setPhase((current) => (current === "checking" ? "invalid" : current))
    }, SESSION_WAIT_MS)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  const handleSubmit = async () => {
    setError(null)
    if (password.length < MIN_PASSWORD_CHARS) {
      setError(`Use at least ${String(MIN_PASSWORD_CHARS)} characters.`)
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    setPending(true)
    try {
      await updatePassword(password)
      setPhase("done")
      setTimeout(() => router.push("/dashboard"), 1400)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update your password."
      if (/session/i.test(message)) {
        // The recovery session expired while the form was open.
        setPhase("invalid")
      } else {
        setError(message)
        setPending(false)
      }
    }
  }

  if (phase === "checking") {
    return (
      <div className="w-full max-w-[400px] rounded-[10px] border border-hairline bg-card p-8 text-center shadow-sm">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground motion-safe:animate-pulse">
          Checking your reset link…
        </p>
      </div>
    )
  }

  if (phase === "invalid") {
    return (
      <div className="w-full max-w-[400px] rounded-[10px] border border-hairline bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-tan text-forest">
          <LinkIcon className="h-5 w-5" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-medium tracking-tight">This link has expired</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Reset links only work once and for a short time. Request a fresh one and try again.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            href="/forgot-password"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-forest text-sm font-medium text-forest-foreground transition-colors hover:bg-forest/90"
          >
            Request a new link
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (phase === "done") {
    return (
      <div className="w-full max-w-[400px] rounded-[10px] border border-hairline bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-tan text-forest">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-medium tracking-tight">Password updated</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          You&apos;re signed in. Taking you to your dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[400px] rounded-[10px] border border-hairline bg-card p-8 shadow-sm">
      <div className="text-center">
        <h1 className="text-balance font-serif text-2xl font-medium tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>
      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-password" className="text-sm font-medium">
            New password
          </Label>
          <Input
            id="new-password"
            type="password"
            required
            minLength={MIN_PASSWORD_CHARS}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-[10px] border-hairline bg-background"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium">
            Confirm password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            required
            minLength={MIN_PASSWORD_CHARS}
            autoComplete="new-password"
            placeholder="Repeat the new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 rounded-[10px] border-hairline bg-background"
          />
        </div>

        {error ? <p className="text-sm leading-snug text-destructive">{error}</p> : null}

        <Button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 w-full rounded-[10px] bg-forest text-sm font-medium text-forest-foreground hover:bg-forest/90"
        >
          {pending ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </div>
  )
}
