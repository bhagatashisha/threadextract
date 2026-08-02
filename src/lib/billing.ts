import { prisma } from "@/lib/db";
import { FREE_TIER_MONTHLY_CAP } from "@/lib/pricing";
import type { Workspace } from "@prisma/client";

export type EffectiveTier = "TRIAL" | "FREE" | "PRO";

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"];

/**
 * Resolves the workspace's effective access tier. PRO if a Stripe
 * subscription is active/trialing/past_due (past_due still counts — Stripe
 * retries for ~7 days before canceling, we don't cut access on the first
 * failed charge). Otherwise TRIAL while trialEndsAt is in the future, else
 * FREE.
 */
export async function getEffectiveTier(workspace: Workspace): Promise<EffectiveTier> {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
  });
  if (subscription && ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
    return "PRO";
  }
  if (workspace.trialEndsAt && workspace.trialEndsAt.getTime() > Date.now()) {
    return "TRIAL";
  }
  return "FREE";
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function extractionsThisMonth(workspaceId: string): Promise<number> {
  return prisma.extraction.count({
    where: { workspaceId, createdAt: { gte: startOfCurrentMonth() } },
  });
}

/**
 * Can this workspace run another extraction right now? PRO and TRIAL are
 * unlimited; FREE is capped at FREE_TIER_MONTHLY_CAP per calendar month.
 * Call this BEFORE any AI/Notion API call — it's the actual cost-control
 * point, not just a UI gate.
 */
export async function canUseFeature(workspace: Workspace): Promise<boolean> {
  const tier = await getEffectiveTier(workspace);
  if (tier === "PRO" || tier === "TRIAL") return true;
  const count = await extractionsThisMonth(workspace.id);
  return count < FREE_TIER_MONTHLY_CAP;
}

export interface TrialState {
  inTrial: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
}

export function getTrialState(workspace: Workspace): TrialState {
  if (!workspace.trialEndsAt) {
    return { inTrial: false, trialEndsAt: null, daysRemaining: 0 };
  }
  const remainingMs = workspace.trialEndsAt.getTime() - Date.now();
  if (remainingMs <= 0) {
    return { inTrial: false, trialEndsAt: workspace.trialEndsAt, daysRemaining: 0 };
  }
  return {
    inTrial: true,
    trialEndsAt: workspace.trialEndsAt,
    daysRemaining: Math.ceil(remainingMs / (24 * 60 * 60 * 1000)),
  };
}
