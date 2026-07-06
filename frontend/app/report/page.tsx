import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReportData } from "@/lib/report-types"
import { AudienceSection } from "@/components/report/audience-section"
import { CompetitiveLandscape } from "@/components/report/competitive-landscape"
import { CreativeConcepts } from "@/components/report/creative-concepts"
import { ExecutiveSummary } from "@/components/report/executive-summary"
import { Measurement } from "@/components/report/measurement"
import { PositioningSection } from "@/components/report/positioning-section"
import { ReportHeader } from "@/components/report/report-header"
import { Sources } from "@/components/report/sources"
import { StrategySection } from "@/components/report/strategy-section"

export const metadata: Metadata = {
  title: "Sample marketing report — Vantage",
  description:
    "A full sample of the Vantage deliverable: cited research, competitive mapping, positioning, strategy, and scored creative concepts.",
}

/*
 * The entire page renders from this one object. Real reports will hydrate the
 * same ReportData shape from the backend, so swapping sample → live is a data
 * change, not a redesign. Chart values throughout are
 * illustrative sample values — real reports supply these from the backend.
 */
const sampleReport: ReportData = {
  meta: {
    business: "Ridgeline Coffee Roasters",
    descriptor:
      "A subscription-first positioning and creative plan built to turn first-time drinkers into a loyal, recurring audience.",
    chips: [
      { label: "Business type", value: "Specialty coffee roaster" },
      { label: "Goal", value: "Grow DTC subscriptions" },
      { label: "Budget", value: "$4,000 / mo" },
    ],
  },

  executiveSummary: {
    paragraphs: [
      "Specialty coffee has spent a decade teaching customers to romanticize origin — and then shipping them six-week-old beans. Every one of your five closest competitors sells the farm; almost none of them guarantees the week. That gap between the story told and the freshness delivered is the single most exploitable weakness in this category, and Ridgeline is one of the few roasters structurally able to exploit it, because you already roast to order.",
      "The recommendation in one line: stop competing on romance and own the calendar. Position Ridgeline as the weekly ritual, roasted to order — a mid-premium subscription defended by roast-day dispatch, a first-month onboarding sequence designed to survive the fourth-bag churn cliff, and a founder-led content engine that makes freshness a number people can check rather than a claim they have to trust.",
      "The plan that follows is sequenced for a $4,000 monthly budget: organic short-form video and owned email carry the message, local sampling converts the skeptics, and a small paid layer amplifies only what already works. Nothing here requires headcount you don't have.",
    ],
    // illustrative sample values — real reports supply these from the backend
    tiles: [
      { label: "Positioning gap", value: "Fresh × mid-premium", detail: "The unclaimed quadrant on the competitive map" },
      { label: "Priority channel", value: "Short-form video", detail: "35% of recommended effort — demonstration is native proof" },
      { label: "Primary segment", value: "Ritual brewers · 42%", detail: "Own a grinder, brew daily, skeptical of premium fluff" },
      { label: "Q1 objective", value: "40% trial→paid", detail: "Against a category norm of roughly a third" },
    ],
  },

  landscape: {
    // illustrative sample values — real reports supply these from the backend
    points: [
      { name: "Ridgeline", price: 5.8, freshness: 8.8, isYou: true },
      { name: "Copper Kettle", price: 8.6, freshness: 7.2 },
      { name: "Harbor Light", price: 7.2, freshness: 6.1 },
      { name: "Roast Exchange", price: 5.2, freshness: 5.0 },
      { name: "Crate & Pour", price: 6.4, freshness: 3.4 },
      { name: "Daily Drum", price: 2.4, freshness: 2.2 },
    ],
    analysis: [
      {
        text: "The map tells one story clearly: freshness and price are decoupled in this category. Copper Kettle charges a genuine premium and earns part of it on craft, but roasts nationally and averages seven to ten days from roaster to doorstep. Daily Drum wins on price and loses everywhere else. Nobody credibly occupies the top-middle — fresh enough to taste different, priced where a weekly habit can live.",
        cites: [6],
      },
      {
        text: "That quadrant is not empty by accident; it is structurally hard to reach. National players can't roast to order without rebuilding their supply chain, and marketplaces can't control freshness they don't produce. A roaster who ships within 48 hours of roast can claim it with proof rather than positioning language — and buyers who see a roast date treat it as a quality signal even before tasting.",
        cites: [7],
      },
      {
        text: "The strategic risk worth naming: Harbor Light could copy this move locally. They roast well and sit closest to the open territory. The defense is speed and repetition — make the roast date Ridgeline's signature before anyone else prints one, because subscribers who stay past month three overwhelmingly stay for reliability, not discovery.",
        cites: [2],
      },
    ],
    table: [
      {
        name: "Copper Kettle",
        angle: "Third-wave prestige; single-origin storytelling at a national scale",
        weakness: "Roasts centrally — 7–10 days roast-to-door undercuts the craft claim",
      },
      {
        name: "Harbor Light",
        angle: "Neighborhood café loyalty; wholesale-first",
        weakness: "Subscription is an afterthought — no cadence control, no roast-date promise",
      },
      {
        name: "Roast Exchange",
        angle: "Marketplace variety; a new roaster every month",
        weakness: "Freshness varies by vendor; discovery fatigue sets in by delivery four",
      },
      {
        name: "Crate & Pour",
        angle: "Convenience and gifting; heavy paid acquisition",
        weakness: "Pre-ground inventory model; roast dates absent from packaging entirely",
      },
      {
        name: "Daily Drum",
        angle: "Grocery price leadership",
        weakness: "Commodity beans — loses every customer who buys a grinder",
      },
    ],
  },

  audience: {
    // illustrative sample values — real reports supply these from the backend
    segments: [
      { name: "Ritual home-brewers", share: 42, isPrimary: true },
      { name: "Gift & occasion buyers", share: 23 },
      { name: "Curious upgraders", share: 20 },
      { name: "Deal-driven samplers", share: 15 },
    ],
    persona: {
      name: "The Ritual Brewer",
      ageRange: "28–45",
      motivations: [
        "A repeatable weekly cup that rewards the technique she's already invested in",
        "Supporting a roaster with a face, a roast log, and a point of view",
        "Brew guidance that respects her skill instead of talking down to it",
      ],
      objections: [
        "“Another subscription that quietly bills me” — commitment fear blocks trial",
        "“Is this actually better than my grocery premium bag?” — taste proof required",
      ],
      channels: ["Instagram Reels", "YouTube brew tutorials", "Email"],
    },
    implication: {
      text: "The messaging consequence is discipline: write for the 42 percent. Ritual brewers respond to specificity — roast dates, extraction times, tasting notes with real referents — and are actively repelled by vague premium language. Copy that sounds like a knowledgeable friend converts this segment; copy that sounds like a luxury boutique converts nobody. The other three segments still buy when the primary message is strong, because gift buyers purchase what enthusiasts endorse.",
      cites: [3],
    },
  },

  positioning: {
    statement:
      "For home brewers who treat coffee as a weekly ritual, Ridgeline is the roaster whose beans ship within 48 hours of roast — so the fortieth delivery tastes as vivid as the first.",
    tagline: "Ritual, not romance",
    whyNow: [
      {
        text: "This works because it ties the functional benefit (measurable freshness) to the emotional one (a ritual you can count on) and gives the subscription a reason to exist beyond a discount. Positioning built on an operational truth compounds: every on-time, on-date delivery is a repetition of the claim, which is what makes recurring-revenue positioning durable.",
        cites: [4],
      },
      {
        text: "And the timing is right: freshness perception is rising as a purchase driver in packaged coffee while trust in origin storytelling plateaus — buyers have learned that every bag has a farm story, but almost none have a date. Being first to make the date the hero means competitors who follow will look like they're answering you.",
        cites: [7, 1],
      },
    ],
  },

  strategy: {
    narrative: [
      {
        text: "The growth motion is a two-step: lead with a low-friction trial that removes the commitment objection, then use the first three deliveries to build the habit that makes cancellation feel like a loss. Most churn happens before the fourth bag, so the first month is where retention is actually won — the onboarding sequence (a roast-date card in box one, a brew-guide email timed to arrival, a founder check-in before delivery three) is not a nicety, it is the strategy.",
        cites: [2],
      },
      {
        text: "Channel priority follows where craft-coffee intent already lives, not where reach is cheapest. Short-form video demonstrates what copy can only assert — the grind, the bloom, the pour, the date on the bag. Email owns the cadence, because the cadence is the product. Local sampling answers the taste objection no ad can, and converts at farmers-market economics. Paid stays small and follows proof: it amplifies the best organic post of the week rather than leading with creative of its own.",
        cites: [5],
      },
    ],
    pullQuote: "Stop selling bags of coffee. Sell the Tuesday morning where the good stuff never runs out.",
    pullQuoteCaption: "Core message",
    // illustrative sample values — real reports supply these from the backend
    channels: [
      { name: "Short-form video", weight: 35, rationale: "demonstration is the category's native proof: grind, bloom, pour, date" },
      { name: "Owned email & brew guides", weight: 30, rationale: "the cadence is the product; email is where the ritual actually lives" },
      { name: "Local sampling & events", weight: 20, rationale: "trial answers the taste objection no ad can — then converts on the spot" },
      { name: "Paid search & social", weight: 15, rationale: "capture existing 'fresh roasted subscription' intent; support, don't lead" },
    ],
    // illustrative sample values — real reports supply these from the backend
    funnel: [
      { name: "Trial started", detail: "First delivery lands, roast-date card in box", share: 100 },
      { name: "Completes first 3 deliveries", detail: "Onboarding sequence + founder check-in", share: 62, fromPrevious: "62% advance" },
      { name: "Retained at month 6", detail: "Habit formed — cancellation now feels like loss", share: 48, fromPrevious: "78% of those retain" },
    ],
    pillars: [
      {
        title: "Freshness you can schedule",
        body: "Every asset carries a date. The claim is checkable, which is what separates it from every 'small-batch' platitude in the category.",
      },
      {
        title: "Craft without ceremony",
        body: "Expertise in plain language. Three-minute techniques, not ten-minute rituals — respect for skill and for mornings that have a clock.",
      },
      {
        title: "A roaster you actually know",
        body: "The founder's voice, the roast log, the same face every week. Familiarity is the retention asset no marketplace can rent.",
      },
    ],
  },

  concepts: [
    {
      title: "The Roast Date Receipt",
      mechanism: "Distinctive asset proof",
      mechanismId: "distinctive_asset_proof",
      score: "8.7 / 10",
      idea: "Every bag ships with the exact roast date printed large, and the brand builds content around the gap between roast and delivery — turning freshness into a number people can check rather than a claim they have to trust.",
      execution:
        "Launch post: a split-screen showing a supermarket bag with no date beside a Ridgeline bag reading “Roasted 2 days ago.” Caption: “If they won't print the date, ask why.”",
      own: "Competitors bury roast dates because their supply chains can't survive printing them. Making the date the hero is hard to copy without first admitting they hid it.",
      sourceIndex: 6,
      // illustrative sample values — real reports supply these from the backend
      calendar: [
        { week: "Week 1", format: "Reel · split-screen", hook: "If they won't print the date, ask why" },
        { week: "Week 2", format: "Carousel · ship-day photos", hook: "48 hours from roaster to doorstep — here's the receipt" },
        { week: "Week 3", format: "Story poll + UGC ask", hook: "Check your bag: when was it roasted?" },
        { week: "Week 4", format: "Reel + email recap", hook: "One month of receipts: every bag, dated, on time" },
      ],
    },
    {
      title: "Brew With Me, Weekly",
      mechanism: "Useful utility",
      mechanismId: "useful_utility",
      score: "8.4 / 10",
      idea: "A recurring same-time, same-format short video where the founder brews the current week's roast in real time, teaching one small technique per episode and tying it to the delivery cadence.",
      execution:
        "Episode 1: a 45-second V60 pour timed to a 3-minute morning, ending with “this bag lands on your doorstep Friday.” Pin it and repost to email.",
      own: "The consistency and the founder's voice compound into a format followers expect — which a faceless national brand can't fake without hiring an actor.",
      sourceIndex: 4,
    },
    {
      title: "The Cancellation Confession",
      mechanism: "Turn negativity into content",
      mechanismId: "turn_negativity_into_content",
      score: "8.1 / 10",
      idea: "Instead of hiding the cancel button, celebrate it. Content openly invites people to pause anytime — which lowers the commitment fear that blocks the first trial signup.",
      execution:
        "Post: a screen recording of the one-tap pause flow with the caption “Skip a week whenever. We'd rather you come back than feel trapped.”",
      own: "Frictionless pausing signals confidence in the product, and most incumbents make cancellation deliberately annoying — the contrast does the marketing for you.",
      sourceIndex: 7,
    },
  ],

  // illustrative sample values — real reports supply these from the backend
  kpis: [
    { metric: "Trial → paid conversion", target: "≥ 40%", benchmark: "Category benchmark sits near a third; onboarding sequence is the lever" },
    { metric: "First-3-delivery completion", target: "≥ 62%", benchmark: "The churn cliff is bag four — this is the number the strategy defends" },
    { metric: "6-month retention", target: "≥ 78%", benchmark: "Of subscribers who clear month one; reliability, not novelty, drives it" },
    { metric: "Reel → site click-through", target: "≥ 2.5%", benchmark: "Demonstration content against a 1–1.5% food & beverage norm" },
    { metric: "Blended CAC", target: "≤ $28", benchmark: "Payback inside two deliveries at current contribution margin" },
  ],

  sources: [
    { title: "DTC Coffee Subscription Benchmarks 2024", host: "subscriptioninsider.com" },
    { title: "Why Subscribers Stay: Reliability Over Novelty", host: "recharge.com" },
    { title: "Home Brewing Enthusiast Segmentation Report", host: "nationalcoffee.org" },
    { title: "Positioning for Recurring Revenue", host: "reforge.com" },
    { title: "Micro-Influencer Trust in Food & Beverage", host: "later.com" },
    { title: "Specialty Coffee Price Architecture Study", host: "sca.coffee" },
    { title: "Freshness Perception in Packaged Coffee, 2024", host: "mintel.com" },
    { title: "Subscription Churn & Pause-Flow Analysis 2024", host: "profitwell.com" },
  ],
}

/** Alternating full-width band: cream (page bg) / white / soft tan tint. */
function Band({
  tone,
  width,
  children,
}: {
  tone: "cream" | "white" | "tan"
  width: "prose" | "data"
  children: ReactNode
}) {
  const toneClass = tone === "white" ? "border-y border-hairline bg-white" : tone === "tan" ? "bg-tan/25" : ""
  const widthClass = width === "prose" ? "max-w-[760px]" : "max-w-[1000px]"
  return (
    <section className={toneClass}>
      <div className={`mx-auto ${widthClass} px-6 py-20 md:py-24`}>{children}</div>
    </section>
  )
}

export default function ReportPage() {
  const r = sampleReport
  return (
    <main className="min-h-screen bg-background">
      <ReportHeader meta={r.meta} />

      <Band tone="tan" width="data">
        <ExecutiveSummary data={r.executiveSummary} />
      </Band>

      <Band tone="white" width="data">
        <CompetitiveLandscape data={r.landscape} />
      </Band>

      <Band tone="tan" width="data">
        <AudienceSection data={r.audience} />
      </Band>

      <Band tone="cream" width="prose">
        <PositioningSection data={r.positioning} />
      </Band>

      <Band tone="white" width="data">
        <StrategySection data={r.strategy} />
      </Band>

      <Band tone="tan" width="prose">
        <CreativeConcepts concepts={r.concepts} sources={r.sources} />
      </Band>

      <Band tone="white" width="prose">
        <Measurement kpis={r.kpis} />
      </Band>

      <Band tone="cream" width="prose">
        <Sources sources={r.sources} />
      </Band>

      <footer className="border-t border-hairline py-14 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Sample report &middot; illustrative data &middot; generated by Vantage
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-forest px-6 py-3 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
        >
          Run this on your business
          <ArrowRight className="h-4 w-4" />
        </Link>
      </footer>
    </main>
  )
}
