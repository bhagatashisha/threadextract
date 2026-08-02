"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/workspace-context";
import { stripe, STRIPE_PRICE_IDS, type BillingInterval } from "@/lib/stripe";

function priceIdFor(interval: BillingInterval): string {
  return interval === "annual" ? STRIPE_PRICE_IDS.proAnnual : STRIPE_PRICE_IDS.proMonthly;
}

export async function startCheckoutAction(formData: FormData) {
  const { user, workspace } = await requireWorkspaceContext("/billing");

  const intervalRaw = String(formData.get("interval") ?? "monthly");
  const interval: BillingInterval = intervalRaw === "annual" ? "annual" : "monthly";

  const priceId = priceIdFor(interval);
  if (!priceId) {
    throw new Error(
      `Stripe price for interval "${interval}" not configured. Set STRIPE_PRICE_PRO_${interval.toUpperCase()} env var.`,
    );
  }

  const appBase = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const meta = { workspaceId: workspace.id, interval, userId: user.id ?? "" };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    ...(workspace.stripeCustomerId
      ? { customer: workspace.stripeCustomerId }
      : { customer_email: user.email ?? undefined }),
    client_reference_id: workspace.id,
    metadata: meta,
    subscription_data: { metadata: meta },
    success_url: `${appBase}/billing?checkout=success`,
    cancel_url: `${appBase}/billing`,
  });

  if (session.customer && typeof session.customer === "string" && !workspace.stripeCustomerId) {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { stripeCustomerId: session.customer },
    });
  }

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function createPortalAction(): Promise<void> {
  const { workspace } = await requireWorkspaceContext("/billing");

  if (!workspace.stripeCustomerId) {
    redirect("/billing?error=no_subscription");
  }

  const appBase = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${appBase}/billing`,
  });

  redirect(portal.url);
}
