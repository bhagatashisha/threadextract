/**
 * Pure pricing display data — no Stripe SDK import, safe for client
 * components. lib/stripe.ts re-exports this for server-side callers that
 * already import it for the SDK/price IDs.
 */

export type BillingInterval = "monthly" | "annual";

export const FREE_TIER_MONTHLY_CAP = 10;

export const FREE_PLAN = {
  label: "Free",
  price: "$0",
  tagline: `${FREE_TIER_MONTHLY_CAP} extractions/month, one Notion database.`,
  features: [
    `${FREE_TIER_MONTHLY_CAP} thread extractions per month`,
    "One connected Notion database",
    "Community support",
  ],
};

export const PRO_PLAN = {
  label: "Pro",
  monthlyPrice: "$49/mo",
  annualPrice: "$490/yr",
  annualPerMonth: "$41/mo",
  tagline: "Unlimited extractions for your whole workspace.",
  features: [
    "Unlimited thread extractions",
    "One connected Notion database",
    "Priority support",
    "Slack confirmation messages",
  ],
};

export const TRIAL_DAYS = 14;

