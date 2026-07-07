"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/*
  Liquid Glass (React Bits GlassSurface): a real refraction surface, not a
  frosted box. An SVG displacement map (neutral center, directional gradients
  at the rim) drives feDisplacementMap through backdrop-filter: url(#...), so
  the pane bends whatever sits behind it, with a slight per-channel offset for
  chromatic aberration and inset highlights for the specular edge.

  Only Chromium applies SVG filters inside backdrop-filter. Safari and Firefox
  get a graceful fallback: the same tint, edge highlights, and a plain
  backdrop blur. Detection runs on mount, so SSR renders the fallback first
  and Chromium upgrades after hydration.

  The surface has no animation of its own, so there is nothing to disable for
  prefers-reduced-motion; callers that transition tint (the nav) gate their
  transitions with motion-reduce.

  Use ONLY over imagery. Over flat cream or white there is nothing to
  refract and the effect reads as broken glass.
*/

type GlassSurfaceProps = {
  children?: React.ReactNode
  width?: number | string
  height?: number | string
  borderRadius?: number
  /** Refraction strength at the rim, in displacement-map scale units. */
  displace?: number
  /** Extra per-channel displacement for the chromatic fringe. 0 disables it. */
  aberration?: number
  /** Backdrop blur in px. Full value in the fallback, softened in filter mode. */
  blur?: number
  /** 0..1 background tint (cream) laid over the refraction for text contrast. */
  tint?: number
  /** Backdrop saturation multiplier; >1 makes the greens sing through. */
  saturation?: number
  /** Hairline border + inset ring. Turn off when the caller frames itself (nav). */
  bordered?: boolean
  className?: string
  contentClassName?: string
  style?: React.CSSProperties
}

/** True only where backdrop-filter accepts SVG filter urls (Chromium). */
function supportsBackdropSvgFilters(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false
  const ua = navigator.userAgent
  const isFirefox = /firefox/i.test(ua)
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua)
  if (isFirefox || isSafari) return false
  if (typeof ResizeObserver === "undefined") return false
  const probe = document.createElement("div")
  probe.style.backdropFilter = "url(#vantage-glass-probe)"
  return probe.style.backdropFilter.includes("url")
}

/**
 * The displacement map, generated at the surface's real pixel size. 50% gray
 * is "no displacement": the blurred neutral rect keeps the center optically
 * flat, and the red (x) / blue (y) gradients only survive at the rim, which
 * is what makes the edge refract like a lens instead of smearing the text.
 */
function displacementMapUri(width: number, height: number, radius: number): string {
  const edge = Math.max(Math.min(width, height) * 0.14, 6)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="gx" x1="100%" y1="0%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="red"/>
    </linearGradient>
    <linearGradient id="gy" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="blue"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="black"/>
  <rect width="${width}" height="${height}" rx="${radius}" fill="url(#gx)"/>
  <rect width="${width}" height="${height}" rx="${radius}" fill="url(#gy)" style="mix-blend-mode:difference"/>
  <rect x="${edge}" y="${edge}" width="${Math.max(width - edge * 2, 0)}" height="${Math.max(height - edge * 2, 0)}" rx="${radius}" fill="hsl(0 0% 50% / 0.95)" style="filter:blur(${Math.max(edge * 0.6, 2)}px)"/>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** feColorMatrix values that keep exactly one RGB channel plus alpha. */
const CHANNEL_MATRIX: Record<"r" | "g" | "b", string> = {
  r: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
  g: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
  b: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
}

export function GlassSurface({
  children,
  width = "auto",
  height = "auto",
  borderRadius = 10,
  displace = 28,
  aberration = 10,
  blur = 12,
  tint = 0.5,
  saturation = 1.5,
  bordered = true,
  className,
  contentClassName,
  style,
}: GlassSurfaceProps) {
  const filterId = `glass-${React.useId().replace(/[^a-zA-Z0-9-]/g, "")}`
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [refracts, setRefracts] = React.useState(false)
  const [size, setSize] = React.useState({
    w: typeof width === "number" ? width : 320,
    h: typeof height === "number" ? height : 48,
  })

  React.useEffect(() => {
    setRefracts(supportsBackdropSvgFilters())
  }, [])

  // The map must match the rendered pixel size or the rim lands in the wrong
  // place, so measure for real (the nav is fluid width).
  React.useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const measure = () => {
      setSize({ w: Math.max(Math.round(el.offsetWidth), 1), h: Math.max(Math.round(el.offsetHeight), 1) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const mapUri = React.useMemo(
    () => displacementMapUri(size.w, size.h, borderRadius),
    [size.w, size.h, borderRadius],
  )

  const backdrop = refracts
    ? `url(#${filterId}) blur(${Math.max(blur * 0.25, 1)}px) saturate(${saturation})`
    : `blur(${blur}px) saturate(${saturation})`

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{
        width,
        height,
        borderRadius,
        isolation: "isolate",
        backdropFilter: backdrop,
        WebkitBackdropFilter: backdrop,
        background: `color-mix(in oklch, var(--background) ${String(Math.round(tint * 100))}%, transparent)`,
        border: bordered ? "1px solid color-mix(in oklch, var(--foreground) 18%, transparent)" : undefined,
        boxShadow: [
          // specular edge: bright top rim, soft inner ring, faint lower rim
          "inset 0 1px 0 color-mix(in oklch, white 70%, transparent)",
          bordered ? "inset 0 0 0 1px color-mix(in oklch, white 42%, transparent)" : "inset 0 0 0 0 transparent",
          "inset 0 -1px 0 color-mix(in oklch, white 22%, transparent)",
          "0 2px 6px color-mix(in oklch, var(--foreground) 7%, transparent)",
          "0 10px 28px color-mix(in oklch, var(--foreground) 11%, transparent)",
        ].join(", "),
        ...style,
      }}
    >
      {refracts ? (
        <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
          <defs>
            <filter
              id={filterId}
              colorInterpolationFilters="sRGB"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
            >
              <feImage
                href={mapUri}
                x="0"
                y="0"
                width="100%"
                height="100%"
                result="map"
                preserveAspectRatio="none"
              />
              {/* one displacement per channel; the offsets are the chromatic fringe */}
              <feDisplacementMap in="SourceGraphic" in2="map" scale={displace + aberration} xChannelSelector="R" yChannelSelector="B" result="dispR" />
              <feColorMatrix in="dispR" type="matrix" values={CHANNEL_MATRIX.r} result="chanR" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={displace} xChannelSelector="R" yChannelSelector="B" result="dispG" />
              <feColorMatrix in="dispG" type="matrix" values={CHANNEL_MATRIX.g} result="chanG" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale={Math.max(displace - aberration, 0)} xChannelSelector="R" yChannelSelector="B" result="dispB" />
              <feColorMatrix in="dispB" type="matrix" values={CHANNEL_MATRIX.b} result="chanB" />
              <feBlend in="chanR" in2="chanG" mode="screen" result="rg" />
              <feBlend in="rg" in2="chanB" mode="screen" result="rgb" />
              <feGaussianBlur in="rgb" stdDeviation={0.4} />
            </filter>
          </defs>
        </svg>
      ) : null}

      {/* top sheen, part of the specular read */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          background: "linear-gradient(to bottom, color-mix(in oklch, white 30%, transparent), transparent)",
        }}
      />
      <div className={cn("relative z-10 h-full w-full", contentClassName)}>{children}</div>
    </div>
  )
}
