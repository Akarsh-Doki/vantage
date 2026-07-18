// TODO: wire to Stripe Checkout when Stripe is set up.

export type CheckoutPlan = "single" | "pack"

/**
 * Payments are NOT configured yet. This stub is the only thing the paid
 * pricing buttons call. It never navigates, never hits an endpoint, and never
 * touches account state. Whether a user is paid is decided exclusively by the
 * backend (full reports return 402 for non-paid accounts), so nothing on the
 * client can unlock anything.
 *
 * When Stripe exists, this becomes a POST to a backend route that creates a
 * Stripe Checkout Session for the plan's price id, then a redirect to the
 * session URL. Entitlements are granted only by the backend webhook after a
 * verified payment, never here.
 */
export function startCheckout(plan: CheckoutPlan): void {
  console.warn(`Stripe not configured. Checkout for plan "${plan}" is not available yet.`)
}
