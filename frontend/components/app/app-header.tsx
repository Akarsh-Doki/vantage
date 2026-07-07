"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, LogOut, Plus } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"

/** Top bar for authenticated screens: wordmark, New report, user menu. */
export function AppHeader() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <header className="border-b border-hairline bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="font-serif text-lg font-semibold tracking-tight text-foreground">
          Vantage
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-forest px-3.5 py-2 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
          >
            <Plus className="h-4 w-4" />
            New report
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex max-w-[220px] items-center gap-1.5 rounded-[10px] border border-hairline bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary/50"
            >
              <span className="truncate font-mono text-xs">{user?.email ?? "Account"}</span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen ? (
              <>
                {/* click-away backdrop */}
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-[10px] border border-hairline bg-card shadow-md"
                >
                  <div className="border-b border-hairline px-4 py-3">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Signed in as</p>
                    <p className="mt-1 truncate text-sm font-medium text-foreground">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleSignOut()}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-secondary/50"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    Sign out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
