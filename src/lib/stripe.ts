import Stripe from "stripe";

// Stripe's constructor throws immediately if apiKey is falsy — that would
// crash `next build` in any environment missing STRIPE_SECRET_KEY, because
// Next imports this module while collecting page data for every route, even
// ones that never call Stripe unless invoked. A placeholder keeps
// construction lazy-safe: build-time import succeeds everywhere, and the
// real key (present on every deployed environment) is what's actually used
// at runtime.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder_not_a_real_key");

export const STRIPE_PRICE_IDS = {
  proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
  proAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
} as const;

// Re-exported for existing importers — the actual definitions live in
// lib/pricing.ts, which has no Stripe SDK import and is safe for client
// components to pull in directly.
export type { BillingInterval } from "@/lib/pricing";
export { FREE_PLAN, PRO_PLAN, FREE_TIER_MONTHLY_CAP, TRIAL_DAYS } from "@/lib/pricing";

