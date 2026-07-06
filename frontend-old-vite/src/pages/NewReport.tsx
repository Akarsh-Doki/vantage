import { type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import type { Budget, BusinessType, Goal, ReportRequest, RunCreated } from '@/lib/types'

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'local_service', label: 'Local service' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'ecommerce_dtc', label: 'E-commerce / DTC' },
  { value: 'startup_saas', label: 'Startup / SaaS' },
  { value: 'b2b', label: 'B2B' },
  { value: 'creator_personal_brand', label: 'Creator / personal brand' },
]

const GOALS: { value: Goal; label: string }[] = [
  { value: 'awareness', label: 'Brand awareness' },
  { value: 'foot_traffic', label: 'Foot traffic' },
  { value: 'lead_generation', label: 'Lead generation' },
  { value: 'product_launch', label: 'Product launch' },
  { value: 'loyalty_retention', label: 'Loyalty & retention' },
  { value: 'virality', label: 'Virality' },
  { value: 'trust_credibility', label: 'Trust & credibility' },
]

const BUDGETS: { value: Budget; label: string }[] = [
  { value: 'zero', label: 'No budget' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const fieldClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function NewReport() {
  const navigate = useNavigate()

  const [businessName, setBusinessName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [industry, setIndustry] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType>('local_service')
  const [goal, setGoal] = useState<Goal>('awareness')
  const [budget, setBudget] = useState<Budget>('low')
  const [description, setDescription] = useState('')
  const [competitors, setCompetitors] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSubmitting(true)
    setError(null)

    const body: ReportRequest = {
      business_name: businessName.trim(),
      industry: industry.trim(),
      business_type: businessType,
      goal,
      budget,
      website_url: websiteUrl.trim(),
      business_description: description.trim() || undefined,
      competitor_urls: competitors
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    }

    try {
      const created = await api.post<RunCreated>('/reports', body)
      void navigate(`/report/${created.run_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the report.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppHeader />
      <main className="reading-column py-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">New campaign</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
          Tell us about your business
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          We’ll research your market and competitors, then draft a campaign for your review.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          className="mt-10 space-y-6"
        >
          <Field label="Business name" htmlFor="business_name">
            <Input
              id="business_name"
              required
              value={businessName}
              onChange={(event) => {
                setBusinessName(event.target.value)
              }}
              placeholder="Rivertown Coffee Roasters"
            />
          </Field>

          <Field label="Website" htmlFor="website_url">
            <Input
              id="website_url"
              type="url"
              required
              value={websiteUrl}
              onChange={(event) => {
                setWebsiteUrl(event.target.value)
              }}
              placeholder="https://example.com"
            />
          </Field>

          <Field label="Industry" htmlFor="industry">
            <Input
              id="industry"
              required
              value={industry}
              onChange={(event) => {
                setIndustry(event.target.value)
              }}
              placeholder="Specialty coffee"
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-3">
            <Field label="Business type" htmlFor="business_type">
              <select
                id="business_type"
                className={fieldClass}
                value={businessType}
                onChange={(event) => {
                  setBusinessType(event.target.value as BusinessType)
                }}
              >
                {BUSINESS_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Primary goal" htmlFor="goal">
              <select
                id="goal"
                className={fieldClass}
                value={goal}
                onChange={(event) => {
                  setGoal(event.target.value as Goal)
                }}
              >
                {GOALS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Budget" htmlFor="budget">
              <select
                id="budget"
                className={fieldClass}
                value={budget}
                onChange={(event) => {
                  setBudget(event.target.value as Budget)
                }}
              >
                {BUDGETS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="What does the business do? (optional)" htmlFor="description">
            <Textarea
              id="description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
              }}
              placeholder="A neighborhood roaster selling single-origin beans and pour-overs."
            />
          </Field>

          <Field label="Competitor URLs (optional, one per line)" htmlFor="competitors">
            <Textarea
              id="competitors"
              value={competitors}
              onChange={(event) => {
                setCompetitors(event.target.value)
              }}
              placeholder={'https://competitor-one.com\nhttps://competitor-two.com'}
            />
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Starting…' : 'Generate campaign'}
            </Button>
            <span className="font-mono text-xs text-muted-foreground">
              You can review the draft before the final version is generated.
            </span>
          </div>
        </form>
      </main>
    </div>
  )
}
