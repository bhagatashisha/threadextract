import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ExternalLink, Activity, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildSlackOAuthUrl } from "@/lib/slack-oauth-url";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AutoRefresh } from "@/components/auto-refresh";

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
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <Card className="max-w-md w-full border-border/50 shadow-xl shadow-black/5">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">No workspace connected</CardTitle>
            <CardDescription className="text-base mt-2">
              Install ThreadExtract in your Slack workspace to start turning threads into Notion docs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Link
              href={buildSlackOAuthUrl()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#10b981] to-[#3b82f6] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
            >
              Connect to Slack
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentExtractions = await prisma.extraction.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const notionConnected = Boolean(workspace.notionAccessToken && workspace.notionDatabaseId);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
      <AutoRefresh intervalMs={3000} />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
        <p className="text-base text-muted-foreground mt-2">
          React to any Slack message with <span className="font-medium text-foreground bg-muted px-1.5 py-0.5 rounded-md shadow-sm border">🧠</span> to instantly save it to Notion.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="border-border/60 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Slack Workspace</p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{workspace.slackTeamId}</p>
              </div>
              <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100 border-0">Connected</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${notionConnected ? 'bg-green-100' : 'bg-amber-100'}`}>
                {notionConnected ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Activity className="h-5 w-5 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Notion Database</p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {notionConnected ? "Syncing enabled" : "Action required"}
                </p>
              </div>
              {notionConnected ? (
                <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100 border-0">Connected</Badge>
              ) : (
                <Link href="/settings">
                  <Badge variant="warning" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0 cursor-pointer">Configure &rarr;</Badge>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Extractions</CardTitle>
          </div>
          <CardDescription>Your latest threads transformed into Notion documents.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentExtractions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Sparkles className="h-8 w-8 text-blue-500" />}
                title="No extractions yet"
                description="React to any Slack message with 🧠 to extract it into Notion."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentExtractions.map((extraction) => (
                <li key={extraction.id} className="flex items-center justify-between p-4 sm:px-6 hover:bg-muted/20 transition-colors group">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-blue-600 transition-colors">
                      {extraction.title ?? "Untitled extraction"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                      {relativeTime(extraction.createdAt)}
                    </p>
                  </div>
                  {extraction.notionPageUrl && (
                    <a
                      href={extraction.notionPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                      View doc <ExternalLink className="h-3.5 w-3.5" />
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
