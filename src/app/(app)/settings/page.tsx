import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt, safeDecrypt } from "@/lib/crypto";
import { TRIGGER_EMOJI_OPTIONS, sanitizeTriggerEmojis } from "@/lib/trigger-emojis";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

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

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fsettings");

  const workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: session.user.id },
  });

  if (!workspace) {
    redirect("/dashboard");
  }

  const existingNotionToken = workspace.notionAccessToken ? safeDecrypt(workspace.notionAccessToken) : "";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your workspace integrations and preferences.</p>
      </div>

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
    </div>
  );
}
