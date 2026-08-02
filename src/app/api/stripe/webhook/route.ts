import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

async function handleSubscriptionUpsert(subscription: Stripe.Subscription): Promise<void> {
  const stripeSubscriptionId = subscription.id;
  const stripeCustomerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  let workspaceId = (subscription.metadata?.workspaceId as string | undefined) ?? null;
  if (!workspaceId && stripeCustomerId) {
    const workspace = await prisma.workspace.findUnique({ where: { stripeCustomerId } });
    workspaceId = workspace?.id ?? null;
  }

  if (!workspaceId) {
    console.warn("stripe webhook: no workspaceId for subscription", stripeSubscriptionId);
    return;
  }

  const item = subscription.items.data[0];
  const status = subscription.status;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;
  const currentPeriodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;

  await prisma.subscription.upsert({
    where: { workspaceId },
    update: { stripeSubscriptionId, status, currentPeriodEnd, cancelAtPeriodEnd },
    create: { workspaceId, stripeSubscriptionId, status, currentPeriodEnd, cancelAtPeriodEnd },
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      stripeCustomerId,
      pricingTier: ACTIVE_STATUSES.has(status) ? "PRO" : "FREE",
    },
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    console.error("stripe webhook: signature verification failed", e);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId ?? session.client_reference_id;
        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (workspaceId && stripeCustomerId) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: { stripeCustomerId },
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const record = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        if (record) {
          await prisma.subscription.update({
            where: { id: record.id },
            data: { status: "canceled", cancelAtPeriodEnd: false },
          });
          // Trial doesn't come back on cancellation — the source of truth
          // for FREE-tier access is getEffectiveTier(), this just keeps the
          // denormalized Workspace.pricingTier cache honest.
          await prisma.workspace.update({
            where: { id: record.workspaceId },
            data: { pricingTier: "FREE" },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        // Stripe already retries a failed charge for ~7 days before the
        // subscription itself transitions to past_due/canceled (handled
        // above) — we deliberately don't cut access here, just log so this
        // isn't a silent no-op like it was in the sibling repos this was
        // ported from.
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("stripe webhook: invoice payment failed", invoice.id, invoice.customer);
        break;
      }

      default:
        console.log("stripe webhook: ignored event", event.type);
    }
  } catch (e) {
    console.error("stripe webhook: handler error", e);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
