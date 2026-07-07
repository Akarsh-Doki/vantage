import Link from "next/link"

const productLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Sample report", href: "/report" },
]

export function SiteFooter() {
  return (
    <footer className="site-footer border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div>
            <span className="font-serif text-lg font-semibold tracking-tight text-foreground">Vantage</span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              An AI marketing team for small local businesses. Research, strategy, and creative in one run.
            </p>
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Product</h3>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Vantage. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
