/*
 * PLACEHOLDER PRIVACY POLICY FOR THE FREE LAUNCH.
 *
 * This page is plain-language placeholder content written for a free,
 * non-charging launch. It has NOT been reviewed by a lawyer. Before charging
 * money (or accepting any payment details), replace this with a properly
 * reviewed privacy policy and update the "Last updated" date.
 */
import type { Metadata } from "next"
import { SiteFooter } from "@/components/site-footer"
import { SiteNav } from "@/components/site-nav"

export const metadata: Metadata = {
  title: "Privacy · Vantage",
  description: "Privacy policy for Vantage, an AI marketing report tool.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-svh bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[720px] px-6 py-16 md:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-forest">Legal</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-foreground">
          Privacy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: July 8, 2026</p>

        <Section title="What we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>Your account email and sign-in credentials (handled by Supabase Auth).</li>
            <li>
              The business details you enter for a report: name, description, website, industry,
              goal, budget level, and competitor URLs.
            </li>
            <li>The reports the pipeline generates for you.</li>
            <li>Basic usage records (run counts and costs) used for abuse and spend limits.</li>
          </ul>
        </Section>

        <Section title="How your inputs are used">
          <p>
            Your inputs are used to generate your report and for nothing else. To do that, they
            are processed by third-party providers: Anthropic runs the AI models that write the
            report, and Tavily performs the web searches behind the research. Public web pages you
            list (your site and competitors) are fetched and read as sources. We do not sell your
            data and we do not use it for advertising.
          </p>
        </Section>

        <Section title="What not to submit">
          <p>
            Please do not enter patient information or any health data, and do not enter other
            people&apos;s personal data. The form only needs public business facts: what the
            business is, its website, and its competitors.
          </p>
        </Section>

        <Section title="Where your data lives">
          <p>
            Reports and account data are stored in Supabase (Postgres) with row-level security:
            your reports are visible only to your account. Secrets and API keys never appear in
            the browser.
          </p>
        </Section>

        <Section title="Deleting your data">
          <p>
            You can delete any report from your dashboard. To delete your whole account and its
            data, contact us and we will remove it.
          </p>
        </Section>

        <Section title="AI-generated content">
          <p>
            Reports are AI-generated suggestions with no guaranteed results, provided as is, and
            are not professional marketing, legal, or financial advice. Verify claims before
            acting on them.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  )
}
