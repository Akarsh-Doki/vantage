"use client"

import type { ReactNode } from "react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

/*
 * Gentle fade-and-rise as a report section enters the viewport. The hidden
 * state only exists while waiting for the observer, and globals.css forces
 * the final state for prefers-reduced-motion, print, and no-JS, so content
 * can never be lost, only eased in.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.08)
  return (
    <div ref={ref} className={cn("reveal", inView && "reveal-visible", className)}>
      {children}
    </div>
  )
}
