"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleIcon } from "@/components/auth/google-icon"
import { useAuth } from "@/components/providers/auth-provider"

type Mode = "signin" | "signup"

export function LoginCard() {
  const { signInWithGoogle, signInWithPassword, signUp } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<Mode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleGoogle = async () => {
    setError(null)
    setPending(true)
    try {
      await signInWithGoogle() // redirects away on success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google sign-in.")
      setPending(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setNotice(null)
    setPending(true)
    try {
      if (mode === "signin") {
        await signInWithPassword(email, password)
        router.push("/dashboard")
      } else {
        await signUp(email, password)
        // If email confirmation is on, there's no session yet. Tell the user.
        setNotice("Check your inbox to confirm your email, then sign in.")
        setMode("signin")
        setPending(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Try again.")
      setPending(false)
    }
  }

  return (
    <div className="w-full max-w-[400px] rounded-[10px] border border-hairline bg-card p-8 shadow-sm">
      <div className="text-center">
        <h1 className="text-balance font-serif text-2xl font-medium tracking-tight">
          {mode === "signin" ? "Welcome to Vantage" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {mode === "signin" ? "Sign in to continue to your workspace." : "Start with a free sample report."}
        </p>
      </div>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => void handleGoogle()}
        className="mt-8 h-11 w-full gap-2.5 rounded-[10px] border-hairline bg-background text-sm font-medium hover:bg-secondary/60"
      >
        <GoogleIcon className="h-[18px] w-[18px]" />
        Continue with Google
      </Button>
      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-hairline" aria-hidden />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-hairline" aria-hidden />
      </div>
      <form
        className="flex flex-col gap-4"
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            {mode === "signin" ? (
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Forgot?
              </Link>
            ) : null}
          </div>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder={mode === "signin" ? "Enter your password" : "At least 8 characters"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-[10px] border-hairline bg-background"
          />
        </div>

        {error ? <p className="text-sm leading-snug text-destructive">{error}</p> : null}
        {notice ? <p className="text-sm leading-snug text-forest">{notice}</p> : null}

        <Button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 w-full rounded-[10px] bg-forest text-sm font-medium text-forest-foreground hover:bg-forest/90"
        >
          {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin")
            setError(null)
            setNotice(null)
          }}
          className="font-medium text-forest transition-colors hover:text-forest/80"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  )
}
