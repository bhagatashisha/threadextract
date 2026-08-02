import { requireWorkspaceContext } from "@/lib/workspace-context";
import { getEffectiveTier, getTrialState, extractionsThisMonth } from "@/lib/billing";
import { FREE_PLAN, PRO_PLAN, FREE_TIER_MONTHLY_CAP, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { StripeCheckoutButton } from "@/components/billing/StripeCheckoutButton";
import { createPortalAction } from "@/lib/actions/checkout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function BillingPage() {
  const { workspace } = await requireWorkspaceContext("/billing");
  const tier = await getEffectiveTier(workspace);
  const trial = getTrialState(workspace);
  const usedThisMonth = await extractionsThisMonth(workspace.id);
  const stripeConfigured = Boolean(STRIPE_PRICE_IDS.proMonthly);

  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>

        <Card>
          <CardHeader>
            <CardTitle>Current plan: {tier === "TRIAL" ? "Trial" : tier === "PRO" ? "Pro" : "Free"}</CardTitle>
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
                {stripeConfigured ? (
                  <div className="space-y-2">
                    <StripeCheckoutButton interval="monthly">Upgrade monthly</StripeCheckoutButton>
                    <StripeCheckoutButton interval="annual" variant="outline">
                      Upgrade annual ({PRO_PLAN.annualPerMonth})
                    </StripeCheckoutButton>
                  </div>
                ) : (
                  <a
                    href="mailto:hello@korrali.com?subject=ThreadExtract%20Pro"
                    className="inline-flex text-sm text-blue-600 hover:underline"
                  >
                    Contact us to upgrade &rarr;
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
