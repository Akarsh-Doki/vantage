// Shape of a full Vantage report. The sample page fills this with illustrative
// data. Real reports hydrate the same shape from the backend API through
// lib/report-adapter.ts. Sections the backend can't populate yet are optional
// and simply don't render (never invent data to fill them).

export interface ReportMeta {
  business: string
  descriptor: string
  chips: { label: string; value: string }[]
}

export interface InsightTile {
  label: string
  value: string
  detail: string
}

/** A paragraph plus the 1-based numbers of the sources it cites. */
export interface CitedParagraph {
  text: string
  cites: number[]
}

export interface ExecutiveSummary {
  paragraphs: CitedParagraph[]
  tiles?: InsightTile[]
}

export interface CompetitorPoint {
  name: string
  /** horizontal position, 0 to 10 on the map's x axis */
  x: number
  /** vertical position, 0 to 10 on the map's y axis */
  y: number
  isYou?: boolean
}

export interface CompetitorRow {
  name: string
  angle: string
  weakness: string
}

export interface CompetitiveLandscape {
  /** section lede. A report supplies it only when there is real copy for it */
  lede?: string
  /** axis captions, e.g. "Price: value to premium". Required when points exist */
  xLabel?: string
  yLabel?: string
  /** map coordinates. The map renders only when these exist */
  points?: CompetitorPoint[]
  /** annotated whitespace region on the map (sample editorial, optional) */
  highlight?: { x1: number; x2: number; y1: number; y2: number; title: string; note?: string }
  /** analysis paragraphs carry their citation numbers in `cites` */
  analysis?: CitedParagraph[]
  table?: CompetitorRow[]
  /** sources backing the map placements (1-based numbers) */
  cites?: number[]
}

export interface AudienceSegment {
  name: string
  /** share of addressable audience, % */
  share: number
  isPrimary?: boolean
}

export interface Persona {
  name: string
  ageRange: string
  motivations: string[]
  objections: string[]
  channels: string[]
}

export interface Audience {
  /** segment shares. The chart renders only when these exist */
  segments?: AudienceSegment[]
  persona?: Persona
  implication?: CitedParagraph
  /** sources backing the segment shares (1-based numbers) */
  cites?: number[]
}

export interface Positioning {
  statement: string
  tagline?: string
  whyNow?: CitedParagraph[]
}

export interface Channel {
  name: string
  /** recommended share of effort, % (sums to 100) */
  weight: number
  rationale: string
}

export interface FunnelStage {
  name: string
  detail?: string
  /** absolute % of trial cohort remaining at this stage */
  share: number
  /** conversion from previous stage, shown between bars */
  fromPrevious?: string
}

export interface Strategy {
  /** section heading. A generic default applies when absent */
  title?: string
  lede?: string
  narrative: CitedParagraph[]
  pullQuote?: string
  pullQuoteCaption?: string
  channels?: Channel[]
  funnel?: FunnelStage[]
  /** note shown under the funnel diagram */
  funnelNote?: string
  /** annotation on the funnel's steepest drop (sample editorial, optional) */
  funnelDropLabel?: string
  /** sources backing the funnel rates (1-based numbers) */
  funnelCites?: number[]
  pillars?: { title: string; body: string }[]
}

export interface CalendarEntry {
  week: string
  format: string
  hook: string
}

export interface CreativeConcept {
  title: string
  /** human name of the mechanism */
  mechanism: string
  /** id in the Vantage creative-pattern library */
  mechanismId: string
  /** rubric score, e.g. "8.7 / 10". Absent when the run skipped the reviewer */
  score?: string
  idea?: string
  execution: string
  own?: string
  /** content format the concept is native to, e.g. "Instagram Reel" */
  format?: string
  budgetFit?: string
  /** index into sources[]. Absent when the grounding source is unknown */
  sourceIndex?: number
  calendar?: CalendarEntry[]
}

export interface Kpi {
  metric: string
  target: string
  benchmark?: string
}

export interface Source {
  title: string
  host: string
  /** full URL. When present the source entry links out */
  url?: string
}

export interface ReportData {
  meta: ReportMeta
  executiveSummary?: ExecutiveSummary
  landscape?: CompetitiveLandscape
  audience?: Audience
  positioning?: Positioning
  strategy?: Strategy
  concepts?: CreativeConcept[]
  kpis?: Kpi[]
  /** sources backing the KPI context lines (1-based numbers) */
  kpiCites?: number[]
  sources?: Source[]
}
