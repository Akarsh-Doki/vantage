import { BookMarked, Library, RefreshCw, FileDown } from "lucide-react"

const points = [
  {
    icon: BookMarked,
    title: "Live cited research",
    body: "Real-time sources for every claim, so you can trust the strategy and defend it to clients.",
  },
  {
    icon: Library,
    title: "Proprietary creative library",
    body: "Proven local marketing mechanisms feed every concept, not generic filler ideas.",
  },
  {
    icon: RefreshCw,
    title: "Self-correcting review",
    body: "A review agent grades and refines each concept before it ever reaches your desk.",
  },
  {
    icon: FileDown,
    title: "Finished exportable reports",
    body: "Walk away with a polished, shareable campaign, not a wall of raw chat output.",
  },
]

export function Differentiators() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-wider text-forest">Why it&apos;s different</span>
        <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Not another chatbot wrapper
        </h2>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {points.map((point) => {
          const Icon = point.icon
          return (
            <div key={point.title} className="rounded-[10px] border border-border bg-card p-6 transition-colors hover:border-forest/30 sm:p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-secondary text-forest">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-serif text-lg font-semibold text-foreground">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
