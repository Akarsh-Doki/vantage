"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type GlassSurfaceProps = {
  children?: React.ReactNode
  width?: number | string
  height?: number | string
  borderRadius?: number
  blur?: number
  className?: string
}

/*
  Cross-browser-reliable frosted-glass surface (a pragmatic take on React Bits'
  GlassSurface). It uses backdrop-filter + layered highlights, which renders
  consistently across browsers and looks best placed over imagery (e.g. the hero
  photo). The full React Bits "liquid glass" version relies on an SVG displacement
  filter that is flaky cross-browser and needs a vivid background; drop it in here
  if you want that exact effect.
*/
export function GlassSurface({
  children,
  width = "auto",
  height = 48,
  borderRadius = 10,
  blur = 11,
  className,
}: GlassSurfaceProps) {
  return (
    <div
      className={cn("relative inline-flex items-center justify-center overflow-hidden transition-all", className)}
      style={{
        width,
        height,
        borderRadius,
        backdropFilter: `blur(${blur}px) saturate(150%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(150%)`,
        background: "color-mix(in oklch, var(--card) 68%, transparent)",
        border: "1px solid color-mix(in oklch, var(--foreground) 22%, transparent)",
        boxShadow: [
          // inner highlight ring — makes the pane read as glass on flat cream too
          "inset 0 0 0 1px color-mix(in oklch, white 50%, transparent)",
          "inset 0 1px 0 color-mix(in oklch, white 70%, transparent)",
          // soft drop shadow lifting it off the background
          "0 2px 6px color-mix(in oklch, var(--foreground) 8%, transparent)",
          "0 10px 28px color-mix(in oklch, var(--foreground) 14%, transparent)",
        ].join(", "),
      }}
    >
      {/* subtle top sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          background: "linear-gradient(to bottom, color-mix(in oklch, white 38%, transparent), transparent)",
        }}
      />
      <span className="relative z-10 inline-flex h-full w-full items-center justify-center px-4">{children}</span>
    </div>
  )
}
