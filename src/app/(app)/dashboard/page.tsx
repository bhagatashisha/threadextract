import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt, safeDecrypt } from "@/lib/crypto";
import { getEffectiveTier, getTrialState, extractionsThisMonth } from "@/lib/billing";
import { FREE_TIER_MONTHLY_CAP } from "@/lib/pricing";
import { buildSlackOAuthUrl } from "@/lib/slack-oauth-url";
import { TRIGGER_EMOJI_OPTIONS, sanitizeTriggerEmojis } from "@/lib/trigger-emojis";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState } from "@/components/ui/empty-state";

async function saveNotionConfig(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const notionToken = formData.get("notionToken") as string;
  const databaseId = formData.get("databaseId") as string;

  const workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: session.user.id },
  });
  if (!workspace) throw new Error("No connected workspace found for this account");

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      notionAccessToken: encrypt(notionToken),
      notionDatabaseId: databaseId,
    },
  });

  revalidatePath("/dashboard");
}

async function saveTriggerEmojis(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const emojis = formData.getAll("triggerEmojis") as string[];
  const sanitized = sanitizeTriggerEmojis(emojis);

  const workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: session.user.id },
  });
  if (!workspace) throw new Error("No connected workspace found for this account");

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { triggerEmojis: sanitized },
  });

  revalidatePath("/dashboard");
}


function relativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard");

  const workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: session.user.id },
  });

  if (!workspace) {
    return (
      <div className="flex items-center justify-center py-24 px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>No workspace connected</CardTitle>
            <CardDescription>
              Install ThreadExtract in your Slack workspace to start turning threads into Notion docs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link
              href={buildSlackOAuthUrl()}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-[#10b981] to-[#3b82f6] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Add to Slack
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [existingNotionToken, tier, trial, usedThisMonth, recentExtractions] = await Promise.all([
    workspace.notionAccessToken ? Promise.resolve(safeDecrypt(workspace.notionAccessToken)) : Promise.resolve(""),
    getEffectiveTier(workspace),
    Promise.resolve(getTrialState(workspace)),
    extractionsThisMonth(workspace.id),
    prisma.extraction.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const notionConnected = Boolean(workspace.notionAccessToken && workspace.notionDatabaseId);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          React to any Slack message with 🧠 to save it to Notion.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Slack workspace</p>
              <p className="text-xs text-muted-foreground mt-0.5">{workspace.slackTeamId}</p>
            </div>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Notion database</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {notionConnected ? "Connected" : "Not configured yet"}
              </p>
            </div>
            <Badge variant={notionConnected ? "success" : "warning"}>
              {notionConnected ? "Connected" : "Setup needed"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plan: {tier === "TRIAL" ? "Trial" : tier === "PRO" ? "Pro" : "Free"}</CardTitle>
            <Link href="/billing" className="text-sm text-blue-600 hover:underline">
              Manage billing &rarr;
            </Link>
          </div>
          <CardDescription>
            {tier === "TRIAL" &&
              `Unlimited extractions during your trial. ${trial.daysRemaining} day${
                trial.daysRemaining === 1 ? "" : "s"
              } remaining.`}
            {tier === "FREE" && `${usedThisMonth} of ${FREE_TIER_MONTHLY_CAP} free extractions used this month.`}
            {tier === "PRO" && "Unlimited extractions for your whole workspace."}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notion configuration</CardTitle>
          <CardDescription>Connect the Notion database where extracted threads should be saved.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveNotionConfig} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="notionToken">Notion Internal Integration Token</Label>
              <Input
                id="notionToken"
                type="password"
                name="notionToken"
                defaultValue={existingNotionToken}
                placeholder="secret_..."
                required
              />
              <p className="text-xs text-muted-foreground">From your Notion Integrations dashboard.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="databaseId">Notion Database ID</Label>
              <Input
                id="databaseId"
                type="text"
                name="databaseId"
                defaultValue={workspace.notionDatabaseId || ""}
                placeholder="e.g., 1234567890abcdef"
                required
              />
              <p className="text-xs text-muted-foreground">The ID in the URL of your target database.</p>
            </div>

            <SubmitButton loadingLabel="Saving…">Save configuration</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extraction triggers</CardTitle>
          <CardDescription>Select which Slack emojis should trigger extraction.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveTriggerEmojis} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TRIGGER_EMOJI_OPTIONS.map((opt) => (
                <label
                  key={opt.shortcode}
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    name="triggerEmojis"
                    value={opt.shortcode}
                    defaultChecked={workspace.triggerEmojis.includes(opt.shortcode)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 focus:ring-2 accent-blue-600 cursor-pointer"
                  />
                  <span>
                    {opt.emoji} <span className="text-sm text-muted-foreground ml-1">{opt.label}</span>
                  </span>
                </label>
              ))}
            </div>
            <SubmitButton loadingLabel="Saving…">Save triggers</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent extractions</CardTitle>
          <CardDescription>The last 10 threads saved to Notion from this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentExtractions.length === 0 ? (
            <EmptyState
              icon={<Sparkles />}
              title="No extractions yet"
              description="React to any Slack message with 🧠 to extract it into Notion."
            />
          ) : (
            <ul className="divide-y divide-border">
              {recentExtractions.map((extraction) => (
                <li key={extraction.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {extraction.title ?? "Untitled extraction"}
                    </p>
                    <p className="text-xs text-muted-foreground">{relativeTime(extraction.createdAt)}</p>
                  </div>
                  {extraction.notionPageUrl && (
                    <a
                      href={extraction.notionPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
