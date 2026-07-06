import { Search, Compass, Sparkles } from "lucide-react"

const steps = [
  {
    num: "01",
    icon: Search,
    title: "Research",
    lines: [
      "Three agents gather live competitor, audience, and market signals in parallel.",
      "Every finding is traced back to a real source you can open.",
    ],
  },
  {
    num: "02",
    icon: Compass,
    title: "Strategy",
    lines: [
      "A synthesis step turns the research into positioning, channels, and messaging.",
      "A clear plan tailored to your local market.",
    ],
  },
  {
    num: "03",
    icon: Sparkles,
    title: "Creative",
    lines: [
      "Concepts are drafted, scored, and refined by a review agent before you see them.",
      "You get finished, exportable campaigns.",
    ],
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-wider text-forest">The pipeline</span>
        <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          From blank page to finished campaign
        </h2>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.num} className="rounded-[10px] border border-border bg-card p-6 transition-colors hover:border-forest/30 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-secondary text-forest">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-sm text-muted-foreground">{step.num}</span>
              </div>
              <h3 className="mt-6 font-serif text-xl font-semibold text-foreground">{step.title}</h3>
              <div className="mt-3 space-y-2">
                {step.lines.map((line) => (
                  <p key={line} className="text-sm leading-relaxed text-muted-foreground">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
