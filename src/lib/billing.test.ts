import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Workspace } from "@prisma/client";

const findUnique = vi.fn();
const count = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: { findUnique: (...args: unknown[]) => findUnique(...args) },
    extraction: { count: (...args: unknown[]) => count(...args) },
  },
}));

const { getEffectiveTier, canUseFeature, getTrialState } = await import("./billing");

function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "ws_1",
    slackTeamId: "T123",
    slackAccessToken: "enc",
    notionAccessToken: null,
    notionDatabaseId: null,
    ownerUserId: null,
    pricingTier: "TRIAL",
    trialEndsAt: null,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Workspace;
}

describe("billing", () => {
  beforeEach(() => {
    findUnique.mockReset();
    count.mockReset();
  });

  describe("getEffectiveTier", () => {
    it("returns PRO when an active subscription exists", async () => {
      findUnique.mockResolvedValue({ status: "active" });
      const workspace = makeWorkspace({ trialEndsAt: null });
      expect(await getEffectiveTier(workspace)).toBe("PRO");
    });

    it("treats a past_due subscription as still PRO", async () => {
      findUnique.mockResolvedValue({ status: "past_due" });
      const workspace = makeWorkspace();
      expect(await getEffectiveTier(workspace)).toBe("PRO");
    });

    it("returns TRIAL when trialEndsAt is in the future and no subscription", async () => {
      findUnique.mockResolvedValue(null);
      const workspace = makeWorkspace({ trialEndsAt: new Date(Date.now() + 1000 * 60 * 60) });
      expect(await getEffectiveTier(workspace)).toBe("TRIAL");
    });

    it("returns FREE when trial has expired and no subscription", async () => {
      findUnique.mockResolvedValue(null);
      const workspace = makeWorkspace({ trialEndsAt: new Date(Date.now() - 1000) });
      expect(await getEffectiveTier(workspace)).toBe("FREE");
    });

    it("falls back to FREE when subscription is canceled", async () => {
      findUnique.mockResolvedValue({ status: "canceled" });
      const workspace = makeWorkspace({ trialEndsAt: new Date(Date.now() - 1000) });
      expect(await getEffectiveTier(workspace)).toBe("FREE");
    });
  });

  describe("canUseFeature", () => {
    it("always allows PRO workspaces", async () => {
      findUnique.mockResolvedValue({ status: "active" });
      const workspace = makeWorkspace();
      expect(await canUseFeature(workspace)).toBe(true);
      expect(count).not.toHaveBeenCalled();
    });

    it("always allows TRIAL workspaces", async () => {
      findUnique.mockResolvedValue(null);
      const workspace = makeWorkspace({ trialEndsAt: new Date(Date.now() + 100000) });
      expect(await canUseFeature(workspace)).toBe(true);
    });

    it("allows FREE workspaces under the monthly cap", async () => {
      findUnique.mockResolvedValue(null);
      count.mockResolvedValue(4);
      const workspace = makeWorkspace({ trialEndsAt: new Date(Date.now() - 1000) });
      expect(await canUseFeature(workspace)).toBe(true);
    });

    it("blocks FREE workspaces at the monthly cap", async () => {
      findUnique.mockResolvedValue(null);
      count.mockResolvedValue(5);
      const workspace = makeWorkspace({ trialEndsAt: new Date(Date.now() - 1000) });
      expect(await canUseFeature(workspace)).toBe(false);
    });
  });

  describe("getTrialState", () => {
    it("reports no trial when trialEndsAt is null", () => {
      const workspace = makeWorkspace({ trialEndsAt: null });
      expect(getTrialState(workspace)).toEqual({ inTrial: false, trialEndsAt: null, daysRemaining: 0 });
    });

    it("reports an active trial with days remaining", () => {
      const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const workspace = makeWorkspace({ trialEndsAt });
      const state = getTrialState(workspace);
      expect(state.inTrial).toBe(true);
      expect(state.daysRemaining).toBeGreaterThanOrEqual(2);
    });

    it("reports an expired trial", () => {
      const workspace = makeWorkspace({ trialEndsAt: new Date(Date.now() - 1000) });
      const state = getTrialState(workspace);
      expect(state.inTrial).toBe(false);
      expect(state.daysRemaining).toBe(0);
    });
  });
});
