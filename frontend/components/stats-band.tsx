"use client"

// Product facts only. No client / customer numbers (we have none yet).

import { useEffect, useRef, useState } from "react"

// Stronger ease-out (quart) + a longer run so the numbers visibly decelerate,
// crawling the last stretch as they approach the final value.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)
const DURATION_MS = 1700

/**
 * Renders the final value on the server / without JS; once the strip scrolls
 * into view it ticks up from 0 with easing. prefers-reduced-motion (or a
 * missing IntersectionObserver) keeps the final value with no animation.
 */
function useCountUp(target: number, active: boolean) {
  const [display, setDisplay] = useState(target)

  useEffect(() => {
    if (!active) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1)
      setDisplay(Math.round(easeOut(progress) * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    setDisplay(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target])

  return display
}

function Num({
  value,
  suffix,
  active,
  className,
}: {
  value: number
  suffix?: string
  active: boolean
  className: string
}) {
  const display = useCountUp(value, active)
  return (
    <span className={`font-mono font-semibold tabular-nums tracking-tight ${className}`}>
      {display}
      {suffix}
    </span>
  )
}

const sideStats = [
  { value: 3, label: "research agents working in parallel on every report" },
  { value: 8, label: "pipeline stages between your inputs and the finished plan" },
  { value: 1, label: "finished, exportable campaign per run. Not a chat log" },
]

export function StatsBand() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="border-y border-forest-foreground/15 bg-forest text-forest-foreground">
      <div className="mx-auto grid max-w-6xl gap-x-16 gap-y-10 px-4 py-12 sm:px-6 md:py-14 lg:grid-cols-[1.1fr_1fr]">
        {/* Hero stat: the moat, oversized and left-aligned */}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-forest-foreground/60">
            Built for output, measured by proof
          </p>
          <div className="mt-5 flex items-baseline gap-1">
            <Num value={100} suffix="%" active={active} className="text-7xl md:text-8xl" />
          </div>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-forest-foreground/85">
            of claims cited to a live source.
          </p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-forest-foreground/60">
            If a finding can&apos;t be traced to where it came from, it doesn&apos;t ship.
          </p>
        </div>

        {/* Three supporting stats as a ruled editorial list */}
        <div className="divide-y divide-forest-foreground/15 self-center">
          {sideStats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-5 py-4 first:pt-0 last:pb-0">
              <Num value={stat.value} active={active} className="w-14 shrink-0 text-right text-4xl md:text-5xl" />
              <p className="text-sm leading-snug text-forest-foreground/75">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
