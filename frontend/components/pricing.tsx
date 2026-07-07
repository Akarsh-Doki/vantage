"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { startCheckout, type CheckoutPlan } from "@/lib/checkout"

/*
  Pricing is PER-REPORT, one-time purchases. No subscription, so no
  subscription language anywhere in this section. Solid cream section on
  purpose: glass is reserved for the two spots that sit over imagery.

  Paid buttons only call the lib/checkout.ts stub until Stripe is set up;
  access itself is enforced by the backend (402 on full reports for non-paid
  accounts), never by anything here.
*/

type TierCta = { label: string; href: string } | { label: string; plan: CheckoutPlan }

type Tier = {
  name: string
  price: string
  priceNote?: string
  line: string
  features: string[]
  highlighted?: boolean
  cta: TierCta
}

const TIERS: Tier[] = [
  {
    name: "Free sample",
    price: "$0",
    line: "See Vantage in action.",
    features: [
      "A shorter preview report",
      "Live cited research",
      "One business",
      "No card required",
    ],
    cta: { label: "Try a free sample", href: "/login" },
  },
  {
    name: "Single report",
    price: "$29",
    priceNote: "per report",
    line: "One full report, start to finish.",
    features: [
      "Full multi-agent research, strategy, and creative",
      "Every claim cited to a live source",
      "3 scored campaign concepts",
      "Exportable report",
      "One business",
    ],
    highlighted: true,
    cta: { label: "Get started", plan: "single" },
  },
  {
    name: "3-report pack",
    price: "$69",
    priceNote: "$23 per report",
    line: "For multiple angles or locations.",
    features: [
      "Everything in Single",
      "Three full reports",
      "Use across different businesses or strategies",
      "Best value",
    ],
    cta: { label: "Get the pack", plan: "pack" },
  },
]

export function Pricing() {
  // Which paid tier was clicked, so its card can say payments are coming soon.
  const [notice, setNotice] = useState<CheckoutPlan | null>(null)

  const handlePaidClick = (plan: CheckoutPlan) => {
    startCheckout(plan)
    setNotice(plan)
  }

  return (
    <section id="pricing" className="border-t border-hairline bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-forest">Pricing</p>
          <h2 className="mt-3 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Pay for what you need
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            No subscription. Buy a full report when you want one.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-3">
          {TIERS.map((tier) => {
            const cta = tier.cta
            return (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-[10px] p-7 md:p-8 ${
                tier.highlighted
                  ? "border-2 border-forest bg-tan/40"
                  : "border border-hairline bg-card"
              }`}
            >
              {tier.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-forest px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-forest-foreground">
                  Most popular
                </span>
              ) : null}

              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {tier.name}
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-semibold tracking-tight text-foreground">{tier.price}</span>
              </div>
              {tier.priceNote ? (
                <p className="mt-1 font-mono text-xs text-muted-foreground">{tier.priceNote}</p>
              ) : (
                <p className="mt-1 font-mono text-xs text-transparent" aria-hidden>
                  .
                </p>
              )}
              <p className="mt-3 text-sm font-medium text-foreground">{tier.line}</p>

              <ul className="mt-5 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-forest/10">
                      <Check className="h-3 w-3 text-forest" strokeWidth={2.5} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-7">
                {"href" in cta ? (
                  <Link
                    href={cta.href}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-hairline bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
                  >
                    {cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handlePaidClick(cta.plan)}
                      className={
                        tier.highlighted
                          ? "inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-forest px-5 py-2.5 text-sm font-medium text-forest-foreground transition-colors hover:bg-forest-hover"
                          : "inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-hairline bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
                      }
                    >
                      {cta.label}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {notice === cta.plan ? (
                      <p className="mt-2.5 text-center font-mono text-[11px] text-muted-foreground">
                        Payments coming soon. Nothing was charged.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
            )
          })}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
          Every report is grounded in live sources you can verify. Start free, upgrade only when
          you see the value.
        </p>
      </div>
    </section>
  )
}
