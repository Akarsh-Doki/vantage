import type {
  Audience,
  Channel,
  CitedParagraph,
  CompetitiveLandscape,
  CreativeConcept,
  FunnelStage,
  ReportData,
  Source,
} from "@/lib/report-types"
import type { ReportResult } from "@/lib/types"

/*
 * Maps the backend deliverable (GET /reports/{id} -> report) onto the same
 * ReportData shape the sample page renders, so a real report (full or free
 * sample) reuses the exact sample components.
 *
 * Current rows are structured at the source: brief/strategy arrive as
 * {headline?, paragraphs: [{text, cites: [n]}]} plus a numbered sources list
 * ([{n, title, url}]), with concepts carrying source_n. Legacy rows from
 * before that schema hold markdown-ish {text} blobs with inline
 * "[source: url]" markers and string[] sources; those are converted here so
 * raw markdown is never rendered. Sections the backend doesn't produce
 * (competitive map, audience segments, KPIs) stay undefined and never render;
 * we never invent numbers to fill a chart.
 */

const CITE_PATTERN = /\[source:\s*([^[\]\s]+?)\s*\]/gi

/** Key for matching a cited URL against the sources list. */
function urlKey(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase()
}

/** Belt and braces on top of the backend's own sanitizer: strip markdown
 * tokens and emoji, and normalize em/en dashes to the Vantage voice
 * (commas, or "to" for ranges), so no report text ever renders raw markup. */
function cleanText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "")
    .replace(/\*\*/g, "")
    .replace(/[*`]/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, "$1 to $2")
    .replace(/\s*[\u2013\u2014]\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim()
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

function sourceFromUrl(url: string): Source {
  const host = hostOf(url)
  try {
    const u = new URL(url)
    const path = u.pathname === "/" ? "" : decodeURI(u.pathname)
    const label = `${host}${path}`
    return { title: label.length > 96 ? `${label.slice(0, 95)}…` : label, host, url }
  } catch {
    return { title: url, host, url }
  }
}

/** Numbered sources ([{n, title, url}]) or legacy plain URL strings. */
function toSources(raw: unknown[]): Source[] {
  const structured = raw.filter(
    (s): s is { n: number; title?: unknown; url: string } =>
      typeof s === "object" && s !== null && typeof (s as { url?: unknown }).url === "string",
  )
  if (structured.length > 0) {
    return structured
      .slice()
      .sort((a, b) => (a.n ?? 0) - (b.n ?? 0))
      .map((s) => {
        const title = typeof s.title === "string" ? cleanText(s.title) : ""
        return title ? { title, host: hostOf(s.url), url: s.url } : sourceFromUrl(s.url)
      })
  }
  return raw.filter((s): s is string => typeof s === "string").map(sourceFromUrl)
}

/** Structured paragraphs pass through (cleaned); anything else is prose to split. */
function toParagraphs(section: unknown, indexOfSource: (url: string) => number, sourceCount: number): CitedParagraph[] {
  if (typeof section !== "object" || section === null) return []
  const record = section as Record<string, unknown>

  if (Array.isArray(record.paragraphs)) {
    const paragraphs: CitedParagraph[] = []
    for (const item of record.paragraphs) {
      if (typeof item !== "object" || item === null) continue
      const raw = item as { text?: unknown; cites?: unknown }
      const text = cleanText(String(raw.text ?? "").replace(CITE_PATTERN, ""))
      if (!text) continue
      const cites: number[] = []
      for (const value of Array.isArray(raw.cites) ? raw.cites : []) {
        const n = Number(value)
        if (Number.isInteger(n) && n >= 1 && n <= sourceCount && !cites.includes(n)) cites.push(n)
      }
      paragraphs.push({ text, cites })
    }
    return paragraphs
  }

  // Legacy: one markdown-ish text blob with inline [source: url] markers.
  if (typeof record.text === "string") {
    return record.text
      .split(/\n+/)
      .map((line) => {
        const cites: number[] = []
        const withoutMarkers = line.replace(CITE_PATTERN, (_match, url: string) => {
          const i = indexOfSource(url)
          if (i >= 0 && !cites.includes(i + 1)) cites.push(i + 1)
          return ""
        })
        const text = cleanText(withoutMarkers)
        return { text, cites }
      })
      .filter((p) => p.text.length > 0)
  }
  return []
}

// ---- optional visual data blocks (backend-validated; re-checked here) -------
// A chart renders only when its block arrived intact. Anything malformed
// degrades to prose, never to a chart with made-up values.

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null
}

function numberIn(value: unknown, min: number, max: number): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

function citesOf(value: unknown, sourceCount: number): number[] {
  const cites: number[] = []
  for (const item of Array.isArray(value) ? value : []) {
    const n = Number(item)
    if (Number.isInteger(n) && n >= 1 && n <= sourceCount && !cites.includes(n)) cites.push(n)
  }
  return cites
}

/** brief.competitor_map -> positioning map section data, or undefined. */
function toLandscape(raw: unknown, sourceCount: number): CompetitiveLandscape | undefined {
  const block = asRecord(raw)
  if (!block) return undefined
  const xLabel = cleanText(String(block.x_label ?? ""))
  const yLabel = cleanText(String(block.y_label ?? ""))
  const cites = citesOf(block.cites, sourceCount)
  if (!xLabel || !yLabel || cites.length === 0) return undefined
  const points = (Array.isArray(block.points) ? block.points : [])
    .map((item) => {
      const p = asRecord(item)
      if (!p) return null
      const name = cleanText(String(p.name ?? ""))
      const x = numberIn(p.x, 0, 10)
      const y = numberIn(p.y, 0, 10)
      if (!name || x === null || y === null) return null
      return { name, x, y, isYou: p.is_you === true }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
  if (points.length < 3) return undefined
  return { xLabel, yLabel, points, cites }
}

/** brief.audience_segments -> audience section data (chart only), or undefined. */
function toAudience(raw: unknown, sourceCount: number): Audience | undefined {
  const block = asRecord(raw)
  if (!block) return undefined
  const cites = citesOf(block.cites, sourceCount)
  if (cites.length === 0) return undefined
  const segments = (Array.isArray(block.segments) ? block.segments : [])
    .map((item) => {
      const s = asRecord(item)
      if (!s) return null
      const name = cleanText(String(s.name ?? ""))
      const share = numberIn(s.share, 0.1, 100)
      return name && share !== null ? { name, share } : null
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => b.share - a.share)
  if (segments.length < 2) return undefined
  // The largest segment is the emphasized one (presentation, not data).
  return {
    segments: segments.map((s, i) => (i === 0 ? { ...s, isPrimary: true } : s)),
    cites,
  }
}

/** strategy.channels -> recommended channel weights, or undefined. */
function toChannels(raw: unknown): Channel[] | undefined {
  const block = asRecord(raw)
  if (!block) return undefined
  const channels = (Array.isArray(block.items) ? block.items : [])
    .map((item) => {
      const c = asRecord(item)
      if (!c) return null
      const name = cleanText(String(c.name ?? ""))
      const weight = numberIn(c.weight, 1, 100)
      if (!name || weight === null) return null
      return { name, weight: Math.round(weight), rationale: cleanText(String(c.rationale ?? "")) }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.weight - a.weight)
  return channels.length >= 2 ? channels : undefined
}

/** strategy.funnel -> funnel stages with derived stage-to-stage rates. */
function toFunnel(
  raw: unknown,
  sourceCount: number,
): { stages: FunnelStage[]; cites: number[] } | undefined {
  const block = asRecord(raw)
  if (!block) return undefined
  const cites = citesOf(block.cites, sourceCount)
  if (cites.length === 0) return undefined
  const stages = (Array.isArray(block.stages) ? block.stages : [])
    .map((item) => {
      const s = asRecord(item)
      if (!s) return null
      const name = cleanText(String(s.name ?? ""))
      const share = numberIn(s.share, 0.1, 100)
      if (!name || share === null) return null
      return { name, share, detail: cleanText(String(s.detail ?? "")) || undefined }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
  if (stages.length < 2) return undefined
  if (stages.some((s, i) => i > 0 && s.share > (stages[i - 1]?.share ?? 0))) return undefined
  // Stage-to-stage carry-through is arithmetic on the cited shares, not new data.
  const withRates: FunnelStage[] = stages.map((s, i) => {
    if (i === 0) return s
    const prev = stages[i - 1]?.share ?? 0
    return prev > 0 ? { ...s, fromPrevious: `${String(Math.round((s.share / prev) * 100))}% continue` } : s
  })
  return { stages: withRates, cites }
}

/** "distinctive_asset_proof" -> "Distinctive asset proof" */
function mechanismName(id: string): string {
  const words = id.replace(/[_-]+/g, " ").trim()
  if (!words) return "Creative mechanism"
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function toConcept(
  raw: Record<string, unknown>,
  indexOfSource: (url: string) => number,
  sourceCount: number,
): CreativeConcept {
  const str = (key: string): string =>
    typeof raw[key] === "string" ? cleanText(raw[key] as string) : ""
  const mechanismId = str("mechanism_id")
  // Numbered citation from the backend when present; legacy URL match otherwise.
  let sourceIndex: number | undefined
  const n = Number(raw.source_n)
  if (Number.isInteger(n) && n >= 1 && n <= sourceCount) {
    sourceIndex = n - 1
  } else {
    const grounded = str("grounded_in")
    const i = grounded ? indexOfSource(grounded) : -1
    if (i >= 0) sourceIndex = i
  }
  return {
    title: str("title") || "Untitled concept",
    mechanism: mechanismName(mechanismId),
    mechanismId,
    score: typeof raw.score === "number" ? `${raw.score.toFixed(1)} / 10` : undefined,
    idea: str("current_trend_used") || undefined,
    execution: str("execution"),
    own: str("why_ownable") || undefined,
    format: str("format") || undefined,
    budgetFit: str("budget_fit") || undefined,
    belowBar: raw.below_bar === true,
    sourceIndex,
  }
}

export function toReportData(
  result: ReportResult,
  run: { kind: string; name?: string | null },
): ReportData {
  const sources = toSources(result.sources ?? [])
  const indexByKey = new Map(sources.map((s, i) => [urlKey(s.url ?? ""), i]))
  const indexOfSource = (url: string): number => indexByKey.get(urlKey(url)) ?? -1

  const briefParagraphs = toParagraphs(result.brief, indexOfSource, sources.length)
  const strategyParagraphs = toParagraphs(result.strategy, indexOfSource, sources.length)
  const concepts = (result.creative ?? []).map((c) => toConcept(c, indexOfSource, sources.length))
  const scored = concepts.length > 0 && concepts.every((c) => c.score !== undefined)
  const isSample = run.kind === "sample"

  // Visual sections exist only when their validated data blocks arrived;
  // otherwise those parts of the report are prose only. Never invented.
  const landscape = toLandscape(result.brief?.competitor_map, sources.length)
  const audience = toAudience(result.brief?.audience_segments, sources.length)
  const channels = toChannels(result.strategy?.channels)
  const funnel = toFunnel(result.strategy?.funnel, sources.length)

  const headline =
    typeof result.brief?.headline === "string" ? cleanText(result.brief.headline) : ""

  const chips: { label: string; value: string }[] = [
    { label: "Report", value: isSample ? "Free sample" : "Full report" },
  ]
  if (concepts.length > 0) {
    chips.push({ label: "Concepts", value: scored ? `${concepts.length} scored` : String(concepts.length) })
  }
  if (sources.length > 0) {
    chips.push({ label: "Sources cited", value: String(sources.length) })
  }

  const strategy =
    strategyParagraphs.length > 0 || channels || funnel
      ? {
          narrative: strategyParagraphs,
          channels,
          funnel: funnel?.stages,
          funnelCites: funnel?.cites,
        }
      : undefined

  return {
    meta: {
      business: run.name || headline || "Your marketing campaign",
      descriptor: isSample
        ? "A competitive read and one scored campaign concept, built from live competitor research by the Vantage pipeline."
        : "A cited strategy and creative plan researched, drafted, and scored by the Vantage agent pipeline.",
      chips,
    },
    executiveSummary: briefParagraphs.length > 0 ? { paragraphs: briefParagraphs } : undefined,
    landscape,
    audience,
    strategy,
    concepts: concepts.length > 0 ? concepts : undefined,
    sources: sources.length > 0 ? sources : undefined,
  }
}
