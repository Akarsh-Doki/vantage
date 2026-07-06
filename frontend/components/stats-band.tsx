// Product facts only. No client / customer numbers (we have none yet).
const stats = [
  { value: "3", label: "research agents run in parallel on every report" },
  { value: "100%", label: "of findings traced back to a live source" },
  { value: "1", label: "finished, exportable campaign per run" },
]

export function StatsBand() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-center font-mono text-xs uppercase tracking-wider text-primary-foreground/60">
          Built for output, measured by proof
        </p>
        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-mono text-5xl font-semibold tracking-tight sm:text-6xl">{stat.value}</div>
              <p className="mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed text-primary-foreground/70">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
