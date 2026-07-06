import Link from "next/link"

export function SiteNav() {
  return (
    <header className="site-nav sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground">
          Vantage
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          <Link href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            How it works
          </Link>
          <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="/report" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Sample report
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-[10px] bg-forest px-4 py-2 text-sm font-medium text-forest-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}
