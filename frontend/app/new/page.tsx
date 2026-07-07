"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Plus, Sparkles, X } from "lucide-react"
import { z } from "zod"
import { AppHeader } from "@/components/app/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, PaymentRequiredError } from "@/lib/api"
import type { Budget, BusinessType, Goal, ReportInput } from "@/lib/types"

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "local_service", label: "Local service" },
  { value: "restaurant", label: "Restaurant" },
  { value: "ecommerce_dtc", label: "E-commerce / DTC" },
  { value: "startup_saas", label: "Startup / SaaS" },
  { value: "b2b", label: "B2B" },
  { value: "creator_personal_brand", label: "Creator / personal brand" },
]

const GOALS: { value: Goal; label: string }[] = [
  { value: "awareness", label: "Brand awareness" },
  { value: "foot_traffic", label: "Foot traffic" },
  { value: "lead_generation", label: "Lead generation" },
  { value: "product_launch", label: "Product launch" },
  { value: "loyalty_retention", label: "Loyalty and retention" },
  { value: "virality", label: "Virality" },
  { value: "trust_credibility", label: "Trust and credibility" },
]

const BUDGETS: { value: Budget; label: string }[] = [
  { value: "zero", label: "No budget yet" },
  { value: "low", label: "Low (under $1k / mo)" },
  { value: "medium", label: "Medium ($1k to $5k / mo)" },
  { value: "high", label: "High ($5k+ / mo)" },
]

const httpUrl = z
  .string()
  .trim()
  .min(1, "Required")
  .refine((value) => {
    try {
      const u = new URL(value)
      return u.protocol === "http:" || u.protocol === "https:"
    } catch {
      return false
    }
  }, "Enter a valid URL starting with http:// or https://")

const formSchema = z.object({
  business_name: z.string().trim().min(1, "Business name is required").max(120, "Keep it under 120 characters"),
  industry: z.string().trim().min(1, "Industry is required").max(120, "Keep it under 120 characters"),
  website_url: httpUrl,
  business_type: z.enum(BUSINESS_TYPES.map((b) => b.value) as [BusinessType, ...BusinessType[]]),
  goal: z.enum(GOALS.map((g) => g.value) as [Goal, ...Goal[]]),
  budget: z.enum(BUDGETS.map((b) => b.value) as [Budget, ...Budget[]]),
  competitor_urls: z.array(httpUrl).max(5, "Up to 5 competitors"),
})

const selectClass =
  "flex h-11 w-full rounded-[10px] border border-hairline bg-background px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

type Gate = { kind: "upsell" } | { kind: "sample_used"; message: string } | null

export default function NewReportPage() {
  const router = useRouter()

  const [businessName, setBusinessName] = useState("")
  const [industry, setIndustry] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [businessType, setBusinessType] = useState<BusinessType>("local_service")
  const [goal, setGoal] = useState<Goal>("awareness")
  const [budget, setBudget] = useState<Budget>("low")
  const [competitors, setCompetitors] = useState<string[]>([""])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<"full" | "sample" | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [gate, setGate] = useState<Gate>(null)

  const validate = (): ReportInput | null => {
    const filledCompetitors = competitors.map((c) => c.trim()).filter((c) => c.length > 0)
    const parsed = formSchema.safeParse({
      business_name: businessName,
      industry,
      website_url: websiteUrl,
      business_type: businessType,
      goal,
      budget,
      competitor_urls: filledCompetitors,
    })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const [field, index] = issue.path
        const key = field === "competitor_urls" && index !== undefined ? `competitor_${String(index)}` : String(field)
        if (!(key in next)) next[key] = issue.message
      }
      // competitor indices refer to the filtered list; map back to filled rows
      setErrors(next)
      return null
    }
    setErrors({})
    return parsed.data
  }

  const submit = async (mode: "full" | "sample") => {
    setRequestError(null)
    const input = validate()
    if (!input) return
    setPending(mode)
    try {
      // Both kinds start an async run and land on the same progress view:
      // the polling stepper takes over immediately, no blocked form.
      const created = mode === "full" ? await api.createReport(input) : await api.createSample(input)
      router.push(`/reports/${created.run_id}`)
      return // keep the button disabled while navigating
    } catch (err) {
      if (err instanceof PaymentRequiredError) {
        // The backend decides paid/free. 402 on full = upsell; 402 on sample =
        // the one free sample is used.
        setGate(mode === "full" ? { kind: "upsell" } : { kind: "sample_used", message: err.message })
      } else {
        setRequestError(err instanceof Error ? err.message : "Something went wrong. Try again.")
      }
    }
    setPending(null)
  }

  const setCompetitor = (index: number, value: string) => {
    setCompetitors((prev) => prev.map((c, i) => (i === index ? value : c)))
  }

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1.5 text-xs leading-snug text-destructive">{errors[key]}</p> : null

  return (
    <div className="min-h-svh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 md:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-forest">New report</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground">
          Tell us about your business
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The pipeline researches your market and competitors, then drafts a complete campaign with
          every claim cited.
        </p>

        <form
          className="mt-9 space-y-6"
          onSubmit={(e) => {
            e.preventDefault()
            void submit("full")
          }}
        >
          <div>
            <Label htmlFor="business_name" className="text-sm font-medium">
              Business name
            </Label>
            <Input
              id="business_name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ridgeline Coffee Roasters"
              className="mt-2 h-11 rounded-[10px] border-hairline bg-background"
            />
            {fieldError("business_name")}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="website_url" className="text-sm font-medium">
                Website
              </Label>
              <Input
                id="website_url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-2 h-11 rounded-[10px] border-hairline bg-background"
              />
              {fieldError("website_url")}
            </div>
            <div>
              <Label htmlFor="industry" className="text-sm font-medium">
                Industry
              </Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Specialty coffee"
                className="mt-2 h-11 rounded-[10px] border-hairline bg-background"
              />
              {fieldError("industry")}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <Label htmlFor="business_type" className="text-sm font-medium">
                Business type
              </Label>
              <select
                id="business_type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                className={`mt-2 ${selectClass}`}
              >
                {BUSINESS_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="goal" className="text-sm font-medium">
                Primary goal
              </Label>
              <select
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className={`mt-2 ${selectClass}`}
              >
                {GOALS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="budget" className="text-sm font-medium">
                Monthly budget
              </Label>
              <select
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value as Budget)}
                className={`mt-2 ${selectClass}`}
              >
                {BUDGETS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Competitor websites</Label>
              <span className="font-mono text-[11px] text-muted-foreground">optional · up to 5</span>
            </div>
            <div className="mt-2 space-y-2.5">
              {competitors.map((value, index) => (
                <div key={index}>
                  <div className="flex items-center gap-2">
                    <Input
                      type="url"
                      value={value}
                      onChange={(e) => setCompetitor(index, e.target.value)}
                      placeholder={`https://competitor-${String(index + 1)}.com`}
                      aria-label={`Competitor ${String(index + 1)}`}
                      className="h-11 rounded-[10px] border-hairline bg-background"
                    />
                    {competitors.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setCompetitors((prev) => prev.filter((_, i) => i !== index))}
                        aria-label={`Remove competitor ${String(index + 1)}`}
                        className="rounded-[10px] p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  {fieldError(`competitor_${String(index)}`)}
                </div>
              ))}
            </div>
            {competitors.length < 5 ? (
              <button
                type="button"
                onClick={() => setCompetitors((prev) => [...prev, ""])}
                className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-xs text-forest transition-colors hover:text-forest-hover"
              >
                <Plus className="h-3.5 w-3.5" />
                Add another
              </button>
            ) : null}
          </div>

          {requestError ? (
            <p className="rounded-[10px] border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {requestError}
            </p>
          ) : null}

          {gate?.kind === "upsell" ? (
            <div className="rounded-[10px] border border-forest/20 bg-tan/40 p-6">
              <p className="font-mono text-[11px] uppercase tracking-wider text-forest">Paid feature</p>
              <h2 className="mt-2 font-serif text-xl font-semibold tracking-tight text-foreground">
                Full reports are a paid feature
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Upgrade to run complete, exportable campaigns with review and approval. Your free
                sample is still available below.
              </p>
              <Link
                href="/#pricing"
                className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-forest px-4 py-2 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
              >
                See pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}

          {gate?.kind === "sample_used" ? (
            <p className="rounded-[10px] border border-forest/20 bg-tan/40 px-4 py-3 text-sm leading-relaxed text-foreground">
              {gate.message}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center">
            <Button
              type="submit"
              disabled={pending !== null}
              className="h-11 rounded-[10px] bg-forest px-6 text-sm font-medium text-forest-foreground hover:bg-forest-hover"
            >
              {pending === "full" ? "Starting…" : "Generate full report"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending !== null}
              onClick={() => void submit("sample")}
              className="h-11 gap-2 rounded-[10px] border-hairline px-6 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4 text-forest" />
              {pending === "sample" ? "Starting your sample…" : "Run a free sample"}
            </Button>
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            Free accounts get one sample report. Full reports include review, approval, and export.
          </p>
        </form>
      </main>
    </div>
  )
}
