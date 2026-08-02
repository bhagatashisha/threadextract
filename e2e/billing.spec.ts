import { test, expect } from "@playwright/test";
import { createUser, createWorkspace, createExtraction, cleanup, prisma } from "./helpers/db";
import { loginAs } from "./helpers/auth";

const STRIPE_CONFIGURED = Boolean(process.env.STRIPE_PRICE_PRO_MONTHLY);

test.describe("Billing page", () => {
  test("Free tier shows usage and both plan cards", async ({ page, context, baseURL }) => {
    const user = await createUser();
    const workspace = await createWorkspace({ ownerUserId: user.id, pricingTier: "FREE", trialEndsAt: new Date(Date.now() - 1000) });
    await createExtraction({ workspaceId: workspace.id });
    await createExtraction({ workspaceId: workspace.id });

    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/billing");

      await expect(page.getByText(/current plan: free/i)).toBeVisible();
      await expect(page.getByText(/used 2 of 5 free extractions/i)).toBeVisible();
      await expect(page.getByText("Free", { exact: true })).toBeVisible();
      await expect(page.getByText("Pro", { exact: true })).toBeVisible();
      await expect(page.getByText("$29/mo")).toBeVisible();
    } finally {
      await cleanup({ userId: user.id, workspaceId: workspace.id });
    }
  });

  test("Trial workspace shows days remaining", async ({ page, context, baseURL }) => {
    const user = await createUser();
    const workspace = await createWorkspace({
      ownerUserId: user.id,
      pricingTier: "TRIAL",
      trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/billing");

      await expect(page.getByText(/current plan: trial/i)).toBeVisible();
      await expect(page.getByText(/day.*remaining/i)).toBeVisible();
    } finally {
      await cleanup({ userId: user.id, workspaceId: workspace.id });
    }
  });

  test("Pro tier shows a Manage billing button and no upgrade cards", async ({ page, context, baseURL }) => {
    const user = await createUser();
    // getEffectiveTier() never trusts Workspace.pricingTier directly (it's a
    // denormalized cache) — an active Subscription row is what actually
    // grants PRO access, so it must be seeded here too.
    const workspace = await createWorkspace({ ownerUserId: user.id, pricingTier: "PRO", stripeCustomerId: "cus_fake" });
    await prisma.subscription.create({
      data: { workspaceId: workspace.id, stripeSubscriptionId: "sub_fake", status: "active" },
    });

    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/billing");

      await expect(page.getByText(/current plan: pro/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /manage billing/i })).toBeVisible();
      await expect(page.getByText("$29/mo")).not.toBeVisible();
    } finally {
      await cleanup({ userId: user.id, workspaceId: workspace.id });
    }
  });

  test("upgrade CTA falls back to a contact link when Stripe prices aren't configured", async ({
    page,
    context,
    baseURL,
  }) => {
    test.skip(STRIPE_CONFIGURED, "Stripe is configured in this env — see the next test instead");
    const user = await createUser();
    const workspace = await createWorkspace({ ownerUserId: user.id, pricingTier: "FREE" });

    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/billing");
      await expect(page.getByRole("link", { name: /contact us to upgrade/i })).toBeVisible();
    } finally {
      await cleanup({ userId: user.id, workspaceId: workspace.id });
    }
  });

  test("upgrade CTA redirects to a real Stripe Checkout session when Stripe is configured", async ({
    page,
    context,
    baseURL,
  }) => {
    test.skip(
      !STRIPE_CONFIGURED,
      "No real STRIPE_PRICE_PRO_MONTHLY configured — add one via .env.test.local to exercise this",
    );
    const user = await createUser();
    const workspace = await createWorkspace({ ownerUserId: user.id, pricingTier: "FREE" });

    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/billing");
      await page.getByRole("button", { name: /upgrade monthly/i }).click();
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 });
      expect(page.url()).toContain("checkout.stripe.com");
    } finally {
      await cleanup({ userId: user.id, workspaceId: workspace.id });
    }
  });
});
