import { SiteNav } from "@/components/site-nav"
import { Hero } from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { FeatureShowcase } from "@/components/feature-showcase"
import { StatsBand } from "@/components/stats-band"
import { Differentiators } from "@/components/differentiators"
import { CtaBand } from "@/components/cta-band"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <Hero />
        <HowItWorks />
        <FeatureShowcase />
        <StatsBand />
        <Differentiators />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  )
}
