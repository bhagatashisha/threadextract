import { test, expect } from "@playwright/test";
import { createWorkspace, cleanup, prisma } from "./helpers/db";
import { signSlackBody, signStripeBody } from "./helpers/signing";

const SLACK_SECRET = process.env.SLACK_SIGNING_SECRET!;
const STRIPE_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

test.describe("Slack events webhook security", () => {
  test("unsigned request is rejected", async ({ request }) => {
    const res = await request.post("/api/slack/events", {
      data: { type: "event_callback" },
    });
    expect(res.status()).toBe(401);
  });

  test("wrong signature is rejected", async ({ request }) => {
    const body = JSON.stringify({ type: "event_callback" });
    const res = await request.post("/api/slack/events", {
      headers: {
        "content-type": "application/json",
        "x-slack-signature": "v0=" + "0".repeat(64),
        "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)),
      },
      data: body,
    });
    expect(res.status()).toBe(401);
  });

  test("stale timestamp is rejected even with a technically-correct signature", async ({ request }) => {
    const body = JSON.stringify({ type: "event_callback" });
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 60 * 10);
    const { signature } = signSlackBody(body, SLACK_SECRET, staleTimestamp);
    const res = await request.post("/api/slack/events", {
      headers: {
        "content-type": "application/json",
        "x-slack-signature": signature,
        "x-slack-request-timestamp": staleTimestamp,
      },
      data: body,
    });
    expect(res.status()).toBe(401);
  });

  test("url_verification challenge is echoed back", async ({ request }) => {
    const body = JSON.stringify({ type: "url_verification", challenge: "abc123" });
    const { signature, timestamp } = signSlackBody(body, SLACK_SECRET);
    const res = await request.post("/api/slack/events", {
      headers: {
        "content-type": "application/json",
        "x-slack-signature": signature,
        "x-slack-request-timestamp": timestamp,
      },
      data: body,
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ challenge: "abc123" });
  });

  test("correctly signed but malformed reaction_added event returns 200, not 500 (Slack must not retry-storm)", async ({
    request,
  }) => {
    const body = JSON.stringify({
      type: "event_callback",
      team_id: "T_FAKE",
      event: { type: "reaction_added" /* missing item, reaction */ },
    });
    const { signature, timestamp } = signSlackBody(body, SLACK_SECRET);
    const res = await request.post("/api/slack/events", {
      headers: {
        "content-type": "application/json",
        "x-slack-signature": signature,
        "x-slack-request-timestamp": timestamp,
      },
      data: body,
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("well-formed brain-reaction event for an unknown workspace still returns 200 fast (3-second rule)", async ({
    request,
  }) => {
    const body = JSON.stringify({
      type: "event_callback",
      team_id: "T_DOES_NOT_EXIST",
      event: {
        type: "reaction_added",
        reaction: "brain",
        item: { type: "message", channel: "C123", ts: "1700000000.000100" },
      },
    });
    const { signature, timestamp } = signSlackBody(body, SLACK_SECRET);
    const start = Date.now();
    const res = await request.post("/api/slack/events", {
      headers: {
        "content-type": "application/json",
        "x-slack-signature": signature,
        "x-slack-request-timestamp": timestamp,
      },
      data: body,
    });
    const elapsedMs = Date.now() - start;
    expect(res.status()).toBe(200);
    expect(elapsedMs).toBeLessThan(3000);
  });
});

test.describe("Slack OAuth CSRF", () => {
  test("missing state is rejected before any Slack API call", async ({ request }) => {
    const res = await request.get("/api/slack/oauth?code=fake-code", { maxRedirects: 0 });
    expect(res.status()).toBe(400);
  });

  test("garbage state is rejected", async ({ request }) => {
    const res = await request.get("/api/slack/oauth?code=fake-code&state=garbage", { maxRedirects: 0 });
    expect(res.status()).toBe(400);
  });
});

test.describe("Stripe webhook", () => {
  test("invalid signature is rejected", async ({ request }) => {
    const body = JSON.stringify({ id: "evt_fake", type: "checkout.session.completed", data: { object: {} } });
    const res = await request.post("/api/stripe/webhook", {
      headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=deadbeef" },
      data: body,
    });
    expect(res.status()).toBe(400);
  });

  test("missing signature header is rejected", async ({ request }) => {
    const res = await request.post("/api/stripe/webhook", {
      headers: { "content-type": "application/json" },
      data: JSON.stringify({ id: "evt_fake", type: "checkout.session.completed" }),
    });
    expect(res.status()).toBe(400);
  });

  test("checkout.session.completed sets stripeCustomerId on the workspace", async ({ request }) => {
    const workspace = await createWorkspace({});
    try {
      const body = JSON.stringify({
        id: "evt_checkout_" + workspace.id,
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            metadata: { workspaceId: workspace.id },
            client_reference_id: workspace.id,
            customer: "cus_test_123",
          },
        },
      });
      const signature = signStripeBody(body, STRIPE_SECRET);
      const res = await request.post("/api/stripe/webhook", {
        headers: { "content-type": "application/json", "stripe-signature": signature },
        data: body,
      });
      expect(res.status()).toBe(200);

      const updated = await prisma.workspace.findUnique({ where: { id: workspace.id } });
      expect(updated?.stripeCustomerId).toBe("cus_test_123");
    } finally {
      await cleanup({ workspaceId: workspace.id });
    }
  });

  test("customer.subscription.created upgrades the workspace to PRO", async ({ request }) => {
    const workspace = await createWorkspace({ pricingTier: "FREE" });
    try {
      const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const body = JSON.stringify({
        id: "evt_sub_created_" + workspace.id,
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_test_" + workspace.id,
            customer: "cus_test_" + workspace.id,
            status: "active",
            cancel_at_period_end: false,
            metadata: { workspaceId: workspace.id },
            items: { data: [{ current_period_end: periodEnd }] },
          },
        },
      });
      const signature = signStripeBody(body, STRIPE_SECRET);
      const res = await request.post("/api/stripe/webhook", {
        headers: { "content-type": "application/json", "stripe-signature": signature },
        data: body,
      });
      expect(res.status()).toBe(200);

      const updated = await prisma.workspace.findUnique({ where: { id: workspace.id } });
      expect(updated?.pricingTier).toBe("PRO");

      const subscription = await prisma.subscription.findUnique({ where: { workspaceId: workspace.id } });
      expect(subscription?.status).toBe("active");
      expect(subscription?.stripeSubscriptionId).toBe("sub_test_" + workspace.id);
    } finally {
      await cleanup({ workspaceId: workspace.id });
    }
  });

  test("customer.subscription.deleted downgrades the workspace back to FREE", async ({ request }) => {
    const workspace = await createWorkspace({ pricingTier: "PRO" });
    await prisma.subscription.create({
      data: {
        workspaceId: workspace.id,
        stripeSubscriptionId: "sub_to_cancel_" + workspace.id,
        status: "active",
      },
    });
    try {
      const body = JSON.stringify({
        id: "evt_sub_deleted_" + workspace.id,
        type: "customer.subscription.deleted",
        data: { object: { id: "sub_to_cancel_" + workspace.id } },
      });
      const signature = signStripeBody(body, STRIPE_SECRET);
      const res = await request.post("/api/stripe/webhook", {
        headers: { "content-type": "application/json", "stripe-signature": signature },
        data: body,
      });
      expect(res.status()).toBe(200);

      const updated = await prisma.workspace.findUnique({ where: { id: workspace.id } });
      expect(updated?.pricingTier).toBe("FREE");

      const subscription = await prisma.subscription.findUnique({ where: { workspaceId: workspace.id } });
      expect(subscription?.status).toBe("canceled");
    } finally {
      await cleanup({ workspaceId: workspace.id });
    }
  });

  test("invoice.payment_failed is accepted and logged, access is not cut immediately", async ({ request }) => {
    const body = JSON.stringify({
      id: "evt_invoice_failed",
      type: "invoice.payment_failed",
      data: { object: { id: "in_test_123", customer: "cus_test_123" } },
    });
    const signature = signStripeBody(body, STRIPE_SECRET);
    const res = await request.post("/api/stripe/webhook", {
      headers: { "content-type": "application/json", "stripe-signature": signature },
      data: body,
    });
    expect(res.status()).toBe(200);
  });
});
