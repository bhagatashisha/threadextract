import crypto from "crypto";
import type { PricingTier } from "@prisma/client";
import { prisma } from "../../src/lib/db";

export { prisma };

const RUN_ID = crypto.randomBytes(4).toString("hex");
let counter = 0;

/** Unique-per-call identifier, namespaced to this test run (avoids collisions across repeated local runs). */
export function uniqueId(label: string): string {
  counter += 1;
  return `e2e-${RUN_ID}-${counter}-${label}`;
}

export async function createUser(email?: string) {
  return prisma.user.create({
    data: { email: email ?? `${uniqueId("user")}@e2e.threadextract.local` },
  });
}

/** Creates a database Session row and returns the cookie value to inject via context.addCookies(). */
export async function createSessionForUser(userId: string): Promise<string> {
  const sessionToken = crypto.randomUUID();
  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  return sessionToken;
}

export async function createWorkspace(opts: {
  ownerUserId?: string | null;
  slackTeamId?: string;
  pricingTier?: PricingTier;
  trialEndsAt?: Date | null;
  notionAccessToken?: string | null;
  notionDatabaseId?: string | null;
  stripeCustomerId?: string | null;
}) {
  return prisma.workspace.create({
    data: {
      slackTeamId: opts.slackTeamId ?? uniqueId("team"),
      slackAccessToken: "e2e-fake-slack-token",
      ownerUserId: opts.ownerUserId ?? null,
      pricingTier: opts.pricingTier ?? "TRIAL",
      trialEndsAt: opts.trialEndsAt === undefined ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : opts.trialEndsAt,
      notionAccessToken: opts.notionAccessToken ?? null,
      notionDatabaseId: opts.notionDatabaseId ?? null,
      stripeCustomerId: opts.stripeCustomerId ?? null,
    },
  });
}

export async function createExtraction(opts: {
  workspaceId: string;
  title?: string;
  notionPageUrl?: string;
  createdAt?: Date;
}) {
  return prisma.extraction.create({
    data: {
      workspaceId: opts.workspaceId,
      title: opts.title ?? "Test extraction",
      notionPageUrl: opts.notionPageUrl ?? "https://notion.so/fake-page",
      createdAt: opts.createdAt ?? new Date(),
    },
  });
}

/** Deletes everything created for a test, in FK-safe order. Any id may be omitted. */
export async function cleanup(opts: { userId?: string; workspaceId?: string; extraWorkspaceIds?: string[] }) {
  const workspaceIds = [opts.workspaceId, ...(opts.extraWorkspaceIds ?? [])].filter((id): id is string => Boolean(id));

  if (workspaceIds.length > 0) {
    await prisma.extraction.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
    await prisma.subscription.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
    await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
  }
  if (opts.userId) {
    await prisma.session.deleteMany({ where: { userId: opts.userId } });
    await prisma.workspace.deleteMany({ where: { ownerUserId: opts.userId } });
    await prisma.user.deleteMany({ where: { id: opts.userId } });
  }
}
