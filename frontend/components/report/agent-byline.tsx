import type { ReactNode } from "react"

/*
 * Contributor credential: the specialist agent behind a section, rendered as
 * a small badge token (icon in a bordered tan tile) beside a two-line
 * micro-block, role in mono caps over a quiet descriptor. Reads like a report
 * crediting a specialist, never like a chat. No emoji, no speech bubbles.
 */

export type AgentId = "strategy" | "research" | "audience" | "creative"

function IconBase({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** Compass: the strategy agent sets the heading. */
function CompassIcon() {
  return (
    <IconBase>
      <circle cx={12} cy={12} r={8.5} />
      <path d="M15.2 8.8 13 13l-4.2 2.2L11 11l4.2-2.2Z" />
    </IconBase>
  )
}

/** Magnifier: the research agent reads the sources. */
function MagnifierIcon() {
  return (
    <IconBase>
      <circle cx={10.5} cy={10.5} r={6} />
      <path d="m15.2 15.2 4.8 4.8" />
    </IconBase>
  )
}

/** People: the audience agent profiles who this is for. */
function PeopleIcon() {
  return (
    <IconBase>
      <circle cx={9} cy={8.5} r={3.25} />
      <path d="M3.5 19.5c0-3 2.4-5 5.5-5s5.5 2 5.5 5" />
      <circle cx={16.5} cy={9.5} r={2.5} />
      <path d="M16.8 14.6c2.3.4 3.7 2 3.7 4.4" />
    </IconBase>
  )
}

/** Pen with a spark: the creative director writes the concepts. */
function SparkPenIcon() {
  return (
    <IconBase>
      <path d="m4.5 19.5 1.1-3.9L14.8 6.4a1.7 1.7 0 0 1 2.4 0l.4.4a1.7 1.7 0 0 1 0 2.4l-9.2 9.2-3.9 1.1Z" />
      <path d="M19 3.2v3" />
      <path d="M17.5 4.7h3" />
    </IconBase>
  )
}

const AGENTS: Record<AgentId, { label: string; descriptor: string; icon: ReactNode }> = {
  strategy: {
    label: "Strategy agent",
    descriptor: "Synthesis, positioning, channels",
    icon: <CompassIcon />,
  },
  research: {
    label: "Research agent",
    descriptor: "Live sources, cited findings",
    icon: <MagnifierIcon />,
  },
  audience: {
    label: "Audience agent",
    descriptor: "Segments and personas",
    icon: <PeopleIcon />,
  },
  creative: {
    label: "Creative director",
    descriptor: "Concept generation and scoring",
    icon: <SparkPenIcon />,
  },
}

export function AgentByline({ agent, className = "" }: { agent: AgentId; className?: string }) {
  const { label, descriptor, icon } = AGENTS[agent]
  return (
    <div className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-forest/15 bg-tan/45 text-forest">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
          {label}
        </span>
        <span className="block text-[11px] leading-snug text-muted-foreground">{descriptor}</span>
      </span>
    </div>
  )
}
