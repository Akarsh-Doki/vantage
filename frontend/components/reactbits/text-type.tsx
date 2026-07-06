"use client"

import * as React from "react"

type TextTypeProps = {
  text: string | string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  loop?: boolean
  showCursor?: boolean
  cursorCharacter?: string
  cursorClassName?: string
  className?: string
  startOnVisible?: boolean
}

// Lightweight React Bits-style typing effect. Dependency-free.
export function TextType({
  text,
  typingSpeed = 60,
  deletingSpeed = 30,
  pauseDuration = 2200,
  loop = true,
  showCursor = true,
  cursorCharacter = "|",
  cursorClassName,
  className,
  startOnVisible = false,
}: TextTypeProps) {
  const phrases = React.useMemo(() => (Array.isArray(text) ? text : [text]), [text])
  const [display, setDisplay] = React.useState("")
  const [phraseIndex, setPhraseIndex] = React.useState(0)
  const [deleting, setDeleting] = React.useState(false)
  const [active, setActive] = React.useState(!startOnVisible)
  const containerRef = React.useRef<HTMLSpanElement>(null)

  // Optionally wait until scrolled into view.
  React.useEffect(() => {
    if (!startOnVisible || active) return
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(true)),
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [startOnVisible, active])

  React.useEffect(() => {
    if (!active) return
    const current = phrases[phraseIndex] ?? ""

    // Respect reduced motion: show final text, no animation.
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(current)
      return
    }

    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && display === current) {
      if (phrases.length === 1 && !loop) return
      timeout = setTimeout(() => setDeleting(true), pauseDuration)
    } else if (deleting && display === "") {
      const next = (phraseIndex + 1) % phrases.length
      if (next === 0 && !loop) return
      setDeleting(false)
      setPhraseIndex(next)
    } else {
      timeout = setTimeout(
        () => {
          setDisplay((prev) =>
            deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)
          )
        },
        deleting ? deletingSpeed : typingSpeed
      )
    }

    return () => clearTimeout(timeout)
  }, [active, display, deleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseDuration, loop])

  return (
    <span ref={containerRef} className={className}>
      {display}
      {showCursor && (
        <span className={cursorClassName ?? "text-forest"} aria-hidden style={{ animation: "vantage-caret 1s step-end infinite" }}>
          {cursorCharacter}
        </span>
      )}
      <style>{`@keyframes vantage-caret{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </span>
  )
}
