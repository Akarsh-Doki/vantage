"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { GlassSurface } from "@/components/reactbits/glass-surface"

/*
  Sticky liquid-glass nav, iOS style: the bar refracts the hero image at the
  top of the page and the content scrolling under it. Over the hero the tint
  stays light so the greens bend through; once real content scrolls
  underneath, the tint rises and a hairline appears so text stays readable
  over white sections. Transitions are gated for prefers-reduced-motion.
*/
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`site-nav sticky top-0 z-50 border-b transition-colors duration-300 motion-reduce:transition-none ${
        scrolled ? "border-hairline" : "border-transparent"
      }`}
    >
      <GlassSurface
        width="100%"
        height={56}
        borderRadius={0}
        bordered={false}
        displace={20}
        aberration={6}
        blur={14}
        saturation={1.4}
        tint={scrolled ? 0.82 : 0.55}
        className="transition-colors duration-300 motion-reduce:transition-none"
        contentClassName="flex items-center"
      >
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Vantage
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            <Link href="#how-it-works" className="text-sm text-foreground/70 transition-colors hover:text-foreground">
              How it works
            </Link>
            <Link href="#features" className="text-sm text-foreground/70 transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-foreground/70 transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="/report" className="text-sm text-foreground/70 transition-colors hover:text-foreground">
              Sample report
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-foreground/70 transition-colors hover:text-foreground sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-[10px] bg-forest px-4 py-2 text-sm font-medium text-forest-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </GlassSurface>
    </header>
  )
}
