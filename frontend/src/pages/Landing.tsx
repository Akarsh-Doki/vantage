import { Link } from 'react-router-dom'

import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'

export default function Landing() {
  const { session } = useAuth()

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="reading-column flex items-center justify-between py-6">
        <span className="font-serif text-lg font-semibold tracking-tight">Vantage</span>
        <nav className="flex items-center gap-5 font-mono text-xs uppercase tracking-[0.15em]">
          <Link to="/sample" className="text-primary transition-colors hover:text-primary-hover">
            Sample
          </Link>
          {session ? (
            <Link
              to="/dashboard"
              className="text-primary transition-colors hover:text-primary-hover"
            >
              Dashboard
            </Link>
          ) : (
            <Link to="/login" className="text-primary transition-colors hover:text-primary-hover">
              Log in
            </Link>
          )}
        </nav>
      </div>

      <div className="reading-column py-24 md:py-32">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          An AI marketing team
        </p>
        <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          A marketing campaign that cites its sources.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Tell Vantage about your business and your competitors. A team of agents researches your
          market, drafts a complete campaign, and reviews its own work — every claim traced back to
          real evidence.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild>
            <Link to={session ? '/new' : '/login'}>Start a campaign</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/sample">See a sample</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
