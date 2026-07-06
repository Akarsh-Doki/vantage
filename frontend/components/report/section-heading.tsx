export function SectionHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string
  title: string
  lede?: string
}) {
  return (
    <div className="mb-8">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-forest">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">{title}</h2>
      {lede ? <p className="mt-3 max-w-[640px] text-lg leading-relaxed text-muted-foreground">{lede}</p> : null}
    </div>
  )
}
