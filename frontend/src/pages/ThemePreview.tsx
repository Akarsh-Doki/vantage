import { type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const swatches = [
  { name: 'Background', hex: '#FAFAF8', className: 'bg-background' },
  { name: 'Foreground', hex: '#1A1A17', className: 'bg-foreground' },
  { name: 'Primary', hex: '#1E3D2F', className: 'bg-primary' },
  { name: 'Primary hover', hex: '#2D5F45', className: 'bg-primary-hover' },
  { name: 'Secondary / sand', hex: '#E8E2D5', className: 'bg-secondary' },
  { name: 'Muted', hex: '#F2F0EA', className: 'bg-muted' },
  { name: 'Border', hex: '#EAE8E2', className: 'bg-border' },
  { name: 'Success', hex: '#2D5F45', className: 'bg-success' },
  { name: 'Destructive', hex: '#9B2C2C', className: 'bg-destructive' },
]

/** Green eyebrow + heading, closed by a short green underline accent. */
function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-4 h-0.5 w-10 rounded-full bg-primary" aria-hidden="true" />
    </div>
  )
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div className="mt-8">{children}</div>
    </section>
  )
}

export default function ThemePreview() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="reading-column py-24 md:py-32">
        <div className="space-y-section">
          {/* Hero: the type pairing is the thesis of the whole system. */}
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Vantage · Design foundation
            </p>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              One locked system, before a single screen.
            </h1>
            <p className="mt-6 max-w-xl font-sans text-lg text-muted-foreground">
              Warm paper, deep forest green as a quiet accent, and a single ten-pixel corner. Every
              color, radius, and motion cue below reads from one source of truth. Approve the look
              here and the real screens inherit it for free.
            </p>
          </header>

          <Section eyebrow="Typography" title="Three faces, three jobs">
            <div className="space-y-10">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Fraunces · headings
                </p>
                <p className="font-serif text-4xl font-medium tracking-tight text-foreground">
                  Marketing that cites its sources.
                </p>
              </div>
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Geist · body &amp; UI
                </p>
                <p className="font-sans text-base text-foreground">
                  A multi-agent team researches your market, drafts the campaign, and reviews its
                  own work — every claim traced back to real evidence. Geist keeps the interface
                  calm and legible at a comfortable 1.6 line-height.
                </p>
              </div>
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Geist Mono · numbers &amp; code
                </p>
                <p className="font-mono text-5xl font-medium tabular-nums tracking-tight text-primary">
                  1,284
                  <span className="ml-3 align-middle font-sans text-base text-muted-foreground">
                    sources cited
                  </span>
                </p>
              </div>
            </div>
          </Section>

          <Section eyebrow="Actions" title="Buttons">
            <div className="flex flex-wrap items-center gap-4">
              <Button>Generate campaign</Button>
              <Button variant="secondary">Save draft</Button>
              <Button variant="outline">Preview</Button>
              <Button variant="destructive">Delete</Button>
            </div>
            <p className="mt-5 font-sans text-sm text-muted-foreground">
              The primary button eases to the brighter green on hover; outline and ghost buttons
              wash to a faint green tint — all over 250ms on the shared motion curve.
            </p>
          </Section>

          <Section eyebrow="Surfaces" title="Card & input">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Add a competitor</CardTitle>
                <CardDescription>
                  We fetch their public pages and compare positioning. One domain per line.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <label
                  htmlFor="competitor"
                  className="font-sans text-sm font-medium text-foreground"
                >
                  Competitor website
                </label>
                <Input id="competitor" type="url" placeholder="https://acme.com" />
              </CardContent>
              <CardFooter className="gap-3">
                <Button size="sm">Add competitor</Button>
                <Button size="sm" variant="ghost">
                  Cancel
                </Button>
              </CardFooter>
            </Card>
            <p className="mt-5 font-sans text-sm text-muted-foreground">
              Hover the card — it lifts to the same faint green tint.
            </p>
          </Section>

          <Section eyebrow="Palette" title="The locked colors">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {swatches.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 shrink-0 rounded-md border border-border ${s.className}`}
                  />
                  <div className="flex flex-col">
                    <span className="font-sans text-sm text-foreground">{s.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <footer className="border-t border-border pt-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Radius 0.625rem · ease cubic-bezier(0.16, 1, 0.3, 1) · 250ms · column 44rem
            </p>
          </footer>
        </div>
      </div>
    </main>
  )
}
