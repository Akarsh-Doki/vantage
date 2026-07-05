import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function Login() {
  const { session, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Already signed in — skip the form.
  if (session) return <Navigate to="/dashboard" replace />

  const submit = async () => {
    setError(null)
    setStatus('sending')
    try {
      await signInWithEmail(email)
      setStatus('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the link. Try again.')
      setStatus('idle')
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Log in to Vantage</CardTitle>
          <CardDescription>We’ll email you a magic link — no password to remember.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'sent' ? (
            <p className="text-sm leading-relaxed text-foreground">
              Check <span className="font-medium">{email}</span> for a link to sign in. You can
              close this tab.
            </p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void submit()
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                  }}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send magic link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
