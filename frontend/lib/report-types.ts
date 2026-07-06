// Shape of a full Vantage report. The sample page fills this with illustrative
// data; real reports will hydrate the same shape from the backend API.

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

export interface ExecutiveSummary {
  paragraphs: string[]
  tiles: InsightTile[]
}

export interface CompetitorPoint {
  name: string
  /** 0–10, low → premium */
  price: number
  /** 0–10, perceived freshness & craft */
  freshness: number
  isYou?: boolean
}

export interface CompetitorRow {
  name: string
  angle: string
  weakness: string
}

export interface CompetitiveLandscape {
  points: CompetitorPoint[]
  /** paragraphs may embed citation markers via {{n}} — see renderWithCites */
  analysis: { text: string; cites: number[] }[]
  table: CompetitorRow[]
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
  segments: AudienceSegment[]
  persona: Persona
  implication: { text: string; cites: number[] }
}

export interface Positioning {
  statement: string
  tagline: string
  whyNow: { text: string; cites: number[] }[]
}

export interface Channel {
  name: string
  /** recommended share of effort, % (sums to 100) */
  weight: number
  rationale: string
}

export interface FunnelStage {
  name: string
  detail: string
  /** absolute % of trial cohort remaining at this stage */
  share: number
  /** conversion from previous stage, shown between bars */
  fromPrevious?: string
}

export interface Strategy {
  narrative: { text: string; cites: number[] }[]
  pullQuote: string
  pullQuoteCaption: string
  channels: Channel[]
  funnel: FunnelStage[]
  pillars: { title: string; body: string }[]
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
  score: string
  idea: string
  execution: string
  own: string
  /** index into sources[] */
  sourceIndex: number
  calendar?: CalendarEntry[]
}

export interface Kpi {
  metric: string
  target: string
  benchmark: string
}

export interface Source {
  title: string
  host: string
}

export interface ReportData {
  meta: ReportMeta
  executiveSummary: ExecutiveSummary
  landscape: CompetitiveLandscape
  audience: Audience
  positioning: Positioning
  strategy: Strategy
  concepts: CreativeConcept[]
  kpis: Kpi[]
  sources: Source[]
}
