/*
 * PLACEHOLDER TERMS FOR THE FREE LAUNCH.
 *
 * This page is plain-language placeholder content written for a free,
 * non-charging launch. It has NOT been reviewed by a lawyer. Before charging
 * money (or accepting any payment details), replace this with a properly
 * reviewed Terms of Service and update the "Last updated" date.
 */
import type { Metadata } from "next"
import { SiteFooter } from "@/components/site-footer"
import { SiteNav } from "@/components/site-nav"

export const metadata: Metadata = {
  title: "Terms · Vantage",
  description: "Terms of service for Vantage, an AI marketing report tool.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-svh bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[720px] px-6 py-16 md:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-forest">Legal</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: July 8, 2026</p>

        <Section title="What Vantage is">
          <p>
            Vantage generates marketing reports for small businesses. You describe your business,
            and a pipeline of AI agents researches your market and competitors, then drafts a
            strategy and creative concepts with cited sources. Vantage is currently free to use.
          </p>
        </Section>

        <Section title="AI-generated output">
          <p>
            Everything Vantage produces is AI-generated. Reports are suggestions and starting
            points, not facts you can rely on without checking. Verify claims, statistics, and
            source links before acting on them or publishing them. We do not guarantee any
            business result from using a report, including customers, traffic, or revenue.
          </p>
        </Section>

        <Section title="Not professional advice">
          <p>
            Vantage is not a marketing agency, law firm, or financial advisor. Reports are not
            professional marketing, legal, or financial advice. For decisions that matter, consult
            a qualified professional.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>You agree not to submit:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Patient information or any health data.</li>
            <li>
              Other people&apos;s personal data (names, contact details, or anything that
              identifies a person who has not agreed to it).
            </li>
            <li>Content you do not have the right to share, or anything unlawful.</li>
          </ul>
          <p>
            We may limit or suspend accounts that abuse the service or attempt to work around its
            usage limits.
          </p>
        </Section>

        <Section title="Third-party processing">
          <p>
            To generate a report, your inputs (business name, description, website, and competitor
            URLs) are processed by third-party providers: Anthropic (AI models) and Tavily (web
            search). Public web pages you list are fetched and read as part of the research. See
            the Privacy page for details.
          </p>
        </Section>

        <Section title="Service provided as is">
          <p>
            Vantage is provided &quot;as is&quot; and &quot;as available&quot;, without warranties
            of any kind, express or implied, including fitness for a particular purpose. To the
            maximum extent permitted by law, we are not liable for losses arising from your use of
            the service or reliance on its output.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            Vantage is free today. If paid plans launch, these terms will be replaced before any
            charge is made, and continued use of paid features will require accepting the new
            terms. We may update these terms as the product evolves; the date above reflects the
            latest revision.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  )
}
