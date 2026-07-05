import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'

/** Top bar for signed-in screens: brand, new-report shortcut, and sign out. */
export function AppHeader() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    void navigate('/')
  }

  return (
    <header className="border-b border-border">
      <div className="reading-column flex items-center justify-between py-4">
        <Link
          to="/dashboard"
          className="font-serif text-lg font-semibold tracking-tight text-foreground"
        >
          Vantage
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/new"
            className="font-mono text-xs uppercase tracking-[0.15em] text-primary transition-colors hover:text-primary-hover"
          >
            New report
          </Link>
          {user?.email ? (
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
              {user.email}
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => void handleSignOut()}>
            Sign out
          </Button>
        </nav>
      </div>
    </header>
  )
}
