"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/providers/auth-provider"

/*
 * Request a password reset. After submit we always show the same neutral
 * confirmation whether or not the email is registered, so this page can
 * never be used to probe which accounts exist. Only infrastructure errors
 * (network, rate limit) surface, and those are generic too.
 */
export function ForgotPasswordCard() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    setPending(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch {
      // Generic on purpose: never confirm or deny that the account exists.
      setError("Could not send the reset email right now. Wait a moment and try again.")
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-[400px] rounded-[10px] border border-hairline bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] bg-tan text-forest">
          <MailCheck className="h-5 w-5" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-medium tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          If an account exists for that email, we sent a reset link. It expires after a short
          while, so use it soon.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest transition-colors hover:text-forest/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[400px] rounded-[10px] border border-hairline bg-card p-8 shadow-sm">
      <div className="text-center">
        <h1 className="text-balance font-serif text-2xl font-medium tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Enter your email and we&apos;ll send you a link to set a new one.
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
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-[10px] border-hairline bg-background"
          />
        </div>

        {error ? <p className="text-sm leading-snug text-destructive">{error}</p> : null}

        <Button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 w-full rounded-[10px] bg-forest text-sm font-medium text-forest-foreground hover:bg-forest/90"
        >
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-forest transition-colors hover:text-forest/80">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
