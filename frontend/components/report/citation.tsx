/** A paragraph of analysis followed by its citation chips. */
export function CitedText({ text, cites }: { text: string; cites: number[] }) {
  return (
    <p>
      {text}
      {cites.map((n) => (
        <Cite key={n} n={n} />
      ))}
    </p>
  )
}

export function Cite({ n }: { n: number }) {
  return (
    <a
      href={`#source-${n}`}
      className="ml-0.5 inline-flex -translate-y-1.5 items-center justify-center rounded-[4px] bg-tan px-1 align-baseline font-mono text-[10px] font-semibold text-forest transition-colors hover:bg-forest hover:text-forest-foreground"
      aria-label={`Source ${n}`}
    >
      {n}
    </a>
  )
}
