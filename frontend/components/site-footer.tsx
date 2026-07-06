import Link from "next/link"
import { AtSign, Send, Share2 } from "lucide-react"

const columns = [
  { title: "Product", links: ["How it works", "Features", "Pricing", "Sample report"] },
  { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
]

export function SiteFooter() {
  return (
    <footer className="site-footer border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="font-serif text-lg font-semibold tracking-tight text-foreground">Vantage</span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              An AI marketing team for small local businesses. Research, strategy, and creative in one run.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[AtSign, Send, Share2].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-foreground/80 transition-colors hover:text-foreground">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
