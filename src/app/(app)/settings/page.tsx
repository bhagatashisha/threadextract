import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeDecrypt } from "@/lib/crypto";
import { TRIGGER_EMOJI_OPTIONS, sanitizeTriggerEmojis } from "@/lib/trigger-emojis";
import { revalidatePath } from "next/cache";
import { Client as NotionClient, type DatabaseObjectResponse } from "@notionhq/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

async function disconnectNotion() {
  "use server";

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: session.user.id },
  });
  if (!workspace) throw new Error("No connected workspace found for this account");

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      notionAccessToken: null,
      notionDatabaseId: null,
    },
  });

  revalidatePath("/settings");
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

  revalidatePath("/settings");
}

export default async function SettingsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error as string | undefined;

  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fsettings");

  const workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: session.user.id },
  });

  if (!workspace) {
    redirect("/dashboard");
  }

  let notionDatabaseName: string | null = null;
  let notionDatabaseUrl: string | null = null;
  
  if (workspace.notionAccessToken && workspace.notionDatabaseId) {
    try {
      const notion = new NotionClient({ auth: safeDecrypt(workspace.notionAccessToken) });
      const db = await notion.databases.retrieve({ database_id: workspace.notionDatabaseId }) as DatabaseObjectResponse;
      notionDatabaseName = db.title?.[0]?.plain_text || "Extracted Slack Threads";
      notionDatabaseUrl = db.url || null;
    } catch (e) {
      console.error("Failed to fetch notion database details", e);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your workspace integrations and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notion configuration</CardTitle>
          <CardDescription>Connect Notion to automatically sync your extracted Slack threads.</CardDescription>
        </CardHeader>
        <CardContent>
          {error === "missing_insert" && (
            <div className="mb-6 p-3 border rounded-lg bg-red-50 text-red-800 text-sm border-red-200">
              <strong className="block mb-1 font-semibold">Missing Permissions</strong>
              Your Notion integration requires &quot;Insert Content&quot; capabilities. Please go to your Notion Developer Dashboard, enable &quot;Insert Content&quot;, then reconnect here.
            </div>
          )}
          {error === "no_pages" && (
            <div className="mb-6 p-3 border rounded-lg bg-red-50 text-red-800 text-sm border-red-200">
              <strong className="block mb-1 font-semibold">No Pages Selected</strong>
              You must grant access to at least one Notion page during the connection flow so we can create the database for you. Please try again.
            </div>
          )}
          
          {workspace.notionAccessToken ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50/50 border-green-200">
                <div className="flex items-center gap-2">
                  <span className="text-green-700 font-medium">✅ Connected to Notion</span>
                </div>
                <div className="flex items-center gap-4">
                  <form action={disconnectNotion}>
                    <button type="submit" className="text-sm text-red-600 hover:underline font-medium">Disconnect</button>
                  </form>
                </div>
              </div>

              {notionDatabaseName ? (
                <div className="p-5 border rounded-lg bg-muted/20">
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Destination Database</h3>
                  <div className="flex items-center justify-between bg-background border rounded p-3">
                    <span className="font-semibold text-foreground flex items-center gap-2">
                      <svg viewBox="0 0 15 15" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 4.5V1H1V4.5H4.5ZM4.5 4.5V10.5H1V4.5H4.5ZM4.5 10.5V14H1V10.5H4.5ZM10.5 4.5V1H7V4.5H10.5ZM10.5 4.5V10.5H7V4.5H10.5ZM10.5 10.5V14H7V10.5H10.5ZM14 4.5V1H11.5V4.5H14ZM14 4.5V10.5H11.5V4.5H14ZM14 10.5V14H11.5V10.5H14Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                      {notionDatabaseName}
                    </span>
                    {notionDatabaseUrl && (
                      <a href={notionDatabaseUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-medium">
                        Open in Notion ↗
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    ThreadExtract automatically created this database for you. You can drag and drop it anywhere in your Notion workspace.
                  </p>
                </div>
              ) : (
                <div className="p-3 border rounded-lg bg-yellow-50/50 border-yellow-200 text-yellow-800 text-sm">
                  We connected to Notion, but couldn&apos;t find the destination database. Please disconnect and try again.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">Connect your Notion account and we will automatically set up an <strong>Extracted Slack Threads</strong> database for you.</p>
              <a href="/api/notion/oauth" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Connect Notion
              </a>
            </div>
          )}
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
    </div>
  );
}
