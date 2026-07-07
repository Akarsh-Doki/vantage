/** A paragraph of analysis followed by its citation marks. */
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

/**
 * Superscript citation mark: a small forest number linking to the numbered
 * entry in Sources. Spaced off the preceding word so it reads as a footnote,
 * not a typo.
 */
export function Cite({ n }: { n: number }) {
  return (
    <a
      href={`#source-${n}`}
      aria-label={`Source ${n}`}
      className="relative -top-[0.45em] ml-[3px] rounded-[3px] px-0.5 font-mono text-[0.68em] font-semibold leading-none text-forest transition-colors hover:bg-tan"
    >
      {n}
    </a>
  )
}
