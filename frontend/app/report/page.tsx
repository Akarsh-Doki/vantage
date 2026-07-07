import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReportData } from "@/lib/report-types"
import { ReportView } from "@/components/report/report-view"

export const metadata: Metadata = {
  title: "Sample marketing report · Vantage",
  description:
    "A full sample of the Vantage deliverable: cited research, competitive mapping, positioning, strategy, and scored creative concepts.",
}

/*
 * The entire page renders from this one object. Real reports will hydrate the
 * same ReportData shape from the backend, so swapping sample for live data is
 * a data change, not a redesign. Chart values throughout are
 * illustrative sample values, real reports supply these from the backend.
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
      {
        text: "Specialty coffee spent a decade teaching customers to romanticize origin, then shipped them six-week-old beans. All five of your closest competitors sell the farm story. None of them guarantees the week. That gap is the most exploitable weakness in this category, and Ridgeline is one of the few roasters that can actually exploit it, because you already roast to order.",
        cites: [],
      },
      {
        text: "So stop competing on romance and own the calendar. Position Ridgeline as the weekly ritual, roasted to order: a mid-premium subscription defended by roast-day dispatch, an onboarding month built to survive the fourth-bag churn cliff, and founder-led content that turns freshness into a number people can check.",
        cites: [],
      },
      {
        text: "Everything here fits a $4,000 monthly budget. Organic short-form video and owned email carry the message. Local sampling converts the skeptics. A small paid layer amplifies what already works. No new headcount.",
        cites: [],
      },
    ],
    // illustrative sample values, real reports supply these from the backend
    tiles: [
      { label: "Positioning gap", value: "Fresh × mid-premium", detail: "The unclaimed quadrant on the competitive map" },
      { label: "Priority channel", value: "Short-form video", detail: "Where 35% of the recommended effort goes" },
      { label: "Primary segment", value: "Ritual brewers · 42%", detail: "Own a grinder, brew daily, skeptical of premium fluff" },
      { label: "Q1 objective", value: "40% trial→paid", detail: "Against a category norm of roughly a third" },
    ],
  },

  landscape: {
    lede: "Five competitors on the two axes buyers care about: what they pay, and how fresh the coffee actually arrives.",
    xLabel: "Price: value to premium",
    yLabel: "Freshness & craft",
    // illustrative sample values, real reports supply these from the backend
    points: [
      { name: "Ridgeline", x: 5.8, y: 8.8, isYou: true },
      { name: "Copper Kettle", x: 8.6, y: 7.2 },
      { name: "Harbor Light", x: 7.2, y: 6.1 },
      { name: "Roast Exchange", x: 5.2, y: 5.0 },
      { name: "Crate & Pour", x: 6.4, y: 3.4 },
      { name: "Daily Drum", x: 2.4, y: 2.2 },
    ],
    highlight: { x1: 4.2, x2: 7.6, y1: 7.2, y2: 10, title: "Open territory.", note: "Nobody owns this." },
    analysis: [
      {
        text: "The map tells one story. Price and freshness are decoupled in this category. Copper Kettle charges a real premium and earns some of it on craft, but roasts nationally and averages seven to ten days from roaster to doorstep. Daily Drum wins on price and loses everywhere else. Nobody credibly holds the top middle: fresh enough to taste different, priced where a weekly habit can live.",
        cites: [6],
      },
      {
        text: "That quadrant is not empty by accident. National players cannot roast to order without rebuilding their supply chains, and marketplaces cannot control freshness they do not produce. A roaster who ships within 48 hours of roast can claim it with proof. Buyers who see a roast date treat it as a quality signal before they taste anything.",
        cites: [7],
      },
      {
        text: "One risk worth naming. Harbor Light roasts well and sits closest to the open territory, so they could copy this move locally. The defense is speed: make the roast date Ridgeline's signature before anyone else prints one. Subscribers who stay past month three stay for reliability.",
        cites: [2],
      },
    ],
    table: [
      {
        name: "Copper Kettle",
        angle: "Third-wave prestige; single-origin storytelling at a national scale",
        weakness: "Roasts centrally. Seven to ten days roast-to-door undercuts the craft claim",
      },
      {
        name: "Harbor Light",
        angle: "Neighborhood café loyalty; wholesale-first",
        weakness: "Subscription is an afterthought, with no cadence control and no roast-date promise",
      },
      {
        name: "Roast Exchange",
        angle: "Marketplace variety; a new roaster every month",
        weakness: "Freshness varies by vendor, and discovery fatigue sets in by delivery four",
      },
      {
        name: "Crate & Pour",
        angle: "Convenience and gifting; heavy paid acquisition",
        weakness: "Pre-ground inventory model. Roast dates are absent from packaging entirely",
      },
      {
        name: "Daily Drum",
        angle: "Grocery price leadership",
        weakness: "Commodity beans. Loses every customer who buys a grinder",
      },
    ],
  },

  audience: {
    // illustrative sample values, real reports supply these from the backend
    segments: [
      { name: "Ritual home-brewers", share: 42, isPrimary: true },
      { name: "Gift & occasion buyers", share: 23 },
      { name: "Curious upgraders", share: 20 },
      { name: "Deal-driven samplers", share: 15 },
    ],
    persona: {
      name: "The Ritual Brewer",
      ageRange: "28 to 45",
      motivations: [
        "A repeatable weekly cup that rewards the technique she has already invested in",
        "Supporting a roaster with a face, a roast log, and a point of view",
        "Brew guidance that respects her skill instead of talking down to it",
      ],
      objections: [
        "Another subscription that quietly bills me. Commitment fear blocks the first signup",
        "Is this actually better than my grocery premium bag? She needs taste proof",
      ],
      channels: ["Instagram Reels", "YouTube brew tutorials", "Email"],
    },
    implication: {
      text: "Write for the 42 percent. Ritual brewers respond to specificity: roast dates, extraction times, tasting notes with real referents. Vague premium language repels them. Copy that sounds like a knowledgeable friend converts this segment, and the other three follow it, because gift buyers purchase what enthusiasts endorse.",
      cites: [3],
    },
  },

  positioning: {
    statement:
      "For home brewers who treat coffee as a weekly ritual, Ridgeline is the roaster whose beans ship within 48 hours of roast, so the fortieth delivery tastes as vivid as the first.",
    tagline: "Ritual, not romance",
    whyNow: [
      {
        text: "It works because it ties a functional benefit (measurable freshness) to an emotional one (a ritual you can count on), and it gives the subscription a reason to exist beyond a discount. Positioning built on an operational truth compounds. Every on-time, on-date delivery repeats the claim.",
        cites: [4],
      },
      {
        text: "The timing is right. Freshness perception is rising as a purchase driver while trust in origin storytelling flattens. Buyers have learned that every bag has a farm story and almost none has a date. Whoever makes the date the hero first makes everyone who follows look like an imitator.",
        cites: [7, 1],
      },
    ],
  },

  strategy: {
    title: "How the subscription compounds",
    lede: "Two moves. Make trial easy, then make the first month build a habit.",
    narrative: [
      {
        text: "The growth motion has two steps. Lead with a low-friction trial that removes the commitment objection, then use the first three deliveries to build a habit that cancelling would break. Most churn happens before the fourth bag, so the first month is where retention is won. The onboarding sequence (a roast-date card in box one, a brew-guide email timed to arrival, a founder check-in before delivery three) is not a nicety. It is the strategy.",
        cites: [2],
      },
      {
        text: "Channel priority follows where craft-coffee intent already lives. Short-form video demonstrates what copy can only assert: the grind, the bloom, the pour, the date on the bag. Email owns the cadence. Local sampling answers the taste objection no ad can answer, and it converts at farmers-market economics. Paid spend stays small and amplifies the best organic post of the week instead of leading with its own creative.",
        cites: [5],
      },
    ],
    pullQuote: "Stop selling bags of coffee. Sell the Tuesday morning where the good stuff never runs out.",
    pullQuoteCaption: "Core message",
    // illustrative sample values, real reports supply these from the backend
    channels: [
      { name: "Short-form video", weight: 35, rationale: "demonstration is the category's native proof: grind, bloom, pour, date" },
      { name: "Owned email & brew guides", weight: 30, rationale: "the cadence is the product, and email is where the ritual lives" },
      { name: "Local sampling & events", weight: 20, rationale: "sampling answers the taste objection no ad can, then converts on the spot" },
      { name: "Paid search & social", weight: 15, rationale: "captures people already searching for fresh roasted subscriptions" },
    ],
    // illustrative sample values, real reports supply these from the backend
    funnel: [
      { name: "Trial started", detail: "First delivery lands, roast-date card in box", share: 100 },
      { name: "First three deliveries", detail: "Onboarding sequence + founder check-in", share: 62, fromPrevious: "62% advance" },
      { name: "Retained at month 6", detail: "Habit formed. Cancelling now feels like a loss", share: 48, fromPrevious: "78% of those retain" },
    ],
    funnelNote:
      "The cliff is real: 38 of 100 trials quit before bag four. Every channel and concept in this report points at the middle of this funnel, not the top.",
    funnelDropLabel: "↓ the churn cliff",
    pillars: [
      {
        title: "Freshness you can schedule",
        body: "Every asset carries a date. The claim is checkable, which separates it from every small-batch platitude in the category.",
      },
      {
        title: "Craft without ceremony",
        body: "Expertise in plain language. Three-minute techniques rather than ten-minute ceremonies, with respect for skill and for mornings that have a clock.",
      },
      {
        title: "A roaster you actually know",
        body: "The founder's voice, the roast log, the same face every week. Familiarity is a retention asset no marketplace can rent.",
      },
    ],
  },

  concepts: [
    {
      title: "The Roast Date Receipt",
      mechanism: "Distinctive asset proof",
      mechanismId: "distinctive_asset_proof",
      score: "8.7 / 10",
      idea: "Every bag ships with the exact roast date printed large, and the brand builds content around the gap between roast and delivery. Freshness becomes a number people can check rather than a claim they have to trust.",
      execution:
        "Launch post: a split-screen showing a supermarket bag with no date beside a Ridgeline bag reading “Roasted 2 days ago.” Caption: “If they won't print the date, ask why.”",
      own: "Competitors bury roast dates because their supply chains can't survive printing them. Making the date the hero is hard to copy without first admitting they hid it.",
      sourceIndex: 6,
      // illustrative sample values, real reports supply these from the backend
      calendar: [
        { week: "Week 1", format: "Reel · split-screen", hook: "If they won't print the date, ask why" },
        { week: "Week 2", format: "Carousel · ship-day photos", hook: "48 hours from roaster to doorstep. Here's the receipt" },
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
      own: "The consistency and the founder's voice compound into a format followers expect, which a faceless national brand can't fake without hiring an actor.",
      sourceIndex: 4,
    },
    {
      title: "The Cancellation Confession",
      mechanism: "Turn negativity into content",
      mechanismId: "turn_negativity_into_content",
      score: "8.1 / 10",
      idea: "Instead of hiding the cancel button, celebrate it. Content openly invites people to pause anytime, which lowers the commitment fear that blocks the first trial signup.",
      execution:
        "Post: a screen recording of the one-tap pause flow with the caption “Skip a week whenever. We'd rather you come back than feel trapped.”",
      own: "Frictionless pausing signals confidence in the product. Most incumbents make cancellation deliberately annoying, and the contrast does the marketing for you.",
      sourceIndex: 7,
    },
  ],

  // illustrative sample values, real reports supply these from the backend
  kpis: [
    { metric: "Trial → paid conversion", target: "≥ 40%", benchmark: "Category benchmark sits near a third; onboarding is the lever" },
    { metric: "First-3-delivery completion", target: "≥ 62%", benchmark: "The churn cliff is bag four. This is the number the strategy defends" },
    { metric: "6-month retention", target: "≥ 78%", benchmark: "Of subscribers who clear month one. Reliability drives it" },
    { metric: "Reel → site click-through", target: "≥ 2.5%", benchmark: "Demonstration content against a 1 to 1.5% food and beverage norm" },
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

export default function ReportPage() {
  return (
    <ReportView
      data={sampleReport}
      badge="Sample report"
      backHref="/"
      actions={
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-[10px] bg-forest px-4 py-2 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
        >
          Run this on your business
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
      footer={
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
      }
    />
  )
}
