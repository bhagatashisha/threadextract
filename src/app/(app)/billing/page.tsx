import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEffectiveTier, getTrialState, extractionsThisMonth } from "@/lib/billing";
import { FREE_PLAN, PRO_PLAN, FREE_TIER_MONTHLY_CAP, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { StripeCheckoutButton } from "@/components/billing/StripeCheckoutButton";
import { createPortalAction } from "@/lib/actions/checkout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildSlackOAuthUrl } from "@/lib/slack-oauth-url";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/billing");
  }

  const workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: session.user.id },
  });

  const tier = workspace ? await getEffectiveTier(workspace) : "TRIAL";
  const trial = workspace ? getTrialState(workspace) : { daysRemaining: 7 };
  const usedThisMonth = workspace ? await extractionsThisMonth(workspace.id) : 0;
  const stripeConfigured = Boolean(STRIPE_PRICE_IDS.proMonthly);
  const SLACK_OAUTH_URL = buildSlackOAuthUrl();

  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>

        <Card>
          <CardHeader>
            <CardTitle>Current plan: {tier === "TRIAL" ? "Free" : tier === "PRO" ? "Pro" : "Free"}</CardTitle>
            <CardDescription>
              {tier === "TRIAL" &&
                `You're on a free trial with unlimited extractions. ${trial.daysRemaining} day${
                  trial.daysRemaining === 1 ? "" : "s"
                } remaining.`}
              {tier === "FREE" &&
                `You've used ${usedThisMonth} of ${FREE_TIER_MONTHLY_CAP} free extractions this month.`}
              {tier === "PRO" && "Unlimited extractions. Thanks for being a Pro customer!"}
            </CardDescription>
          </CardHeader>
          {tier === "PRO" && (
            <CardContent>
              <form action={createPortalAction}>
                <Button type="submit" variant="outline">
                  Manage billing
                </Button>
              </form>
            </CardContent>
          )}
        </Card>

        {tier !== "PRO" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{FREE_PLAN.label}</CardTitle>
                <CardDescription>{FREE_PLAN.tagline}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-4">{FREE_PLAN.price}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {FREE_PLAN.features.map((f) => (
                    <li key={f}>&bull; {f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-[#10b981]/40">
              <CardHeader>
                <CardTitle>{PRO_PLAN.label}</CardTitle>
                <CardDescription>{PRO_PLAN.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold">
                  {PRO_PLAN.monthlyPrice}
                  <span className="text-sm font-normal text-muted-foreground"> or {PRO_PLAN.annualPrice}</span>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {PRO_PLAN.features.map((f) => (
                    <li key={f}>&bull; {f}</li>
                  ))}
                </ul>
                {workspace ? (
                  stripeConfigured ? (
                    <div className="space-y-2">
                      <StripeCheckoutButton interval="monthly" className="bg-gradient-to-r from-[#10b981] to-[#3b82f6] hover:opacity-90 border-0 text-white">Buy Pro</StripeCheckoutButton>
                      <StripeCheckoutButton interval="annual" className="bg-gradient-to-r from-[#10b981] to-[#3b82f6] hover:opacity-90 border-0 text-white">
                        Buy Pro (Annual - {PRO_PLAN.annualPerMonth})
                      </StripeCheckoutButton>
                    </div>
                  ) : (
                    <a
                      href="mailto:hello@korrali.com?subject=ThreadExtract%20Pro"
                      className="inline-flex text-sm text-blue-600 hover:underline"
                    >
                      Contact us to upgrade &rarr;
                    </a>
                  )
                ) : (
                  <div className="space-y-2">
                    <a
                      href={SLACK_OAUTH_URL}
                      className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#10b981] to-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 w-full"
                    >
                      Connect to Slack
                    </a>
                    <p className="text-xs text-center text-muted-foreground mt-2">Connect a workspace first to upgrade to Pro.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
