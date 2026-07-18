import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"

/*
 * The full walkthrough of how a report actually gets made, expanded from the
 * old three-card strip. Four concrete steps with custom thin-stroke icons,
 * plus a stylized (clearly abstract, never a fake screenshot) miniature of
 * the deliverable pointing at the real sample at /report.
 */

function StepIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** 01: a short intake form, fields and all. */
function FormIcon() {
  return (
    <StepIcon>
      <rect x={4} y={3.5} width={16} height={17} rx={2.5} />
      <path d="M8 8.5h8" />
      <path d="M8 12h8" />
      <path d="M8 15.5h4.5" />
    </StepIcon>
  )
}

/** 02: one brief fanning out to three research agents. */
function FanOutIcon() {
  return (
    <StepIcon>
      <circle cx={5.5} cy={12} r={2} />
      <circle cx={18.5} cy={5.5} r={2} />
      <circle cx={18.5} cy={12} r={2} />
      <circle cx={18.5} cy={18.5} r={2} />
      <path d="M7.4 11 16.6 6.3" />
      <path d="M7.5 12h9" />
      <path d="M7.4 13 16.6 17.7" />
    </StepIcon>
  )
}

/** 03: a pen drafting, with the reviewer's check on the result. */
function DraftScoreIcon() {
  return (
    <StepIcon>
      <path d="m4.5 19.5 1.1-3.9L14.8 6.4a1.7 1.7 0 0 1 2.4 0l.4.4a1.7 1.7 0 0 1 0 2.4l-9.2 9.2-3.9 1.1Z" />
      <circle cx={18.5} cy={17.5} r={3.25} />
      <path d="m17.2 17.6.9.9 1.7-1.9" />
    </StepIcon>
  )
}

/** 04: the finished document, folded corner, cited lines. */
function ReportIcon() {
  return (
    <StepIcon>
      <path d="M6 3.5h8.5L19 8v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V5a1.5 1.5 0 0 1 1-1.5Z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M8.5 12.5H14" />
      <path d="M8.5 16h7" />
    </StepIcon>
  )
}

const steps = [
  {
    num: "01",
    icon: <FormIcon />,
    title: "Tell us about your business",
    body: "You enter your business, website, goal, budget, and up to five competitors. That is the whole setup.",
  },
  {
    num: "02",
    icon: <FanOutIcon />,
    title: "A team of agents researches live",
    body: "Competitor, audience, and market agents pull real web sources in parallel, and every finding is tied to a citation.",
  },
  {
    num: "03",
    icon: <DraftScoreIcon />,
    title: "Strategy and creative are built and scored",
    body: "A synthesis step turns the research into positioning and strategy. A creative director then drafts concepts that a reviewer agent scores before you see them.",
  },
  {
    num: "04",
    icon: <ReportIcon />,
    title: "You get a finished, cited report",
    body: "A clean report you can read, export as PDF, and act on, with every claim traceable to a source.",
  },
]

/** Miniature, obviously stylized report card. The real thing lives at /report. */
function MiniReport() {
  return (
    <div
      aria-hidden
      className="w-full max-w-[280px] shrink-0 rounded-[10px] border border-hairline bg-background p-4 shadow-sm"
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-forest">Marketing report</p>
      <p className="mt-1.5 font-serif text-sm font-medium leading-snug text-foreground">
        Ridgeline: own the roast date
        <span className="ml-0.5 align-super font-mono text-[8px] font-semibold text-forest">1</span>
      </p>
      <div className="mt-2.5 space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-tan/70" />
        <div className="h-1.5 w-4/5 rounded-full bg-tan/70" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-2.5 w-[85%] rounded-[3px] bg-forest" />
        <div className="h-2.5 w-[60%] rounded-[3px] bg-tan" />
        <div className="h-2.5 w-[40%] rounded-[3px] bg-tan" />
      </div>
      <div className="mt-3 flex gap-1.5 border-t border-hairline pt-2.5">
        <span className="rounded-[4px] bg-tan px-1.5 py-0.5 font-mono text-[8px] font-medium text-forest">
          01 sca.coffee
        </span>
        <span className="rounded-[4px] bg-tan px-1.5 py-0.5 font-mono text-[8px] font-medium text-forest">
          02 mintel.com
        </span>
      </div>
    </div>
  )
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-wider text-forest">How it works</span>
        <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          From blank page to finished campaign
        </h2>
        {/* Who this is for: one confident frame, not a whole section */}
        <p className="mt-5 border-l-2 border-forest pl-4 text-pretty leading-relaxed text-foreground/85">
          Built for local businesses that can&apos;t justify a marketing agency retainer.
          Agency-grade thinking, without the agency price or the wait.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.num}
            className="rounded-[10px] border border-hairline bg-card p-6 transition-colors hover:border-forest/30"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-secondary text-forest">
                {step.icon}
              </span>
              <span className="font-mono text-sm text-muted-foreground">{step.num}</span>
            </div>
            <h3 className="mt-6 font-serif text-xl font-semibold text-foreground">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </div>

      {/* The output the process ends in, with a pointer to the real sample */}
      <div className="mt-6 flex flex-col gap-6 rounded-[10px] border border-hairline bg-card p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
        <div className="max-w-md">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            The output
          </p>
          <h3 className="mt-2 font-serif text-xl font-semibold tracking-tight text-foreground">
            A report, not a chat log
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This is a stylized sketch. The real thing is public: open the full sample report and
            check the citations yourself.
          </p>
          <Link
            href="/report"
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-forest px-5 py-2.5 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
          >
            See a sample report
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <MiniReport />
      </div>
    </section>
  )
}
