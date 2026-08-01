import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function saveNotionConfig(formData: FormData) {
  "use server";
  
  const teamId = formData.get("teamId") as string;
  const notionToken = formData.get("notionToken") as string;
  const databaseId = formData.get("databaseId") as string;

  if (!teamId) throw new Error("Missing team ID");

  await prisma.workspace.update({
    where: { slackTeamId: teamId },
    data: {
      notionAccessToken: notionToken,
      notionDatabaseId: databaseId,
    },
  });

  revalidatePath("/dashboard");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { team_id?: string };
}) {
  const teamId = searchParams.team_id;

  if (!teamId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-sm text-center">
          <h2 className="text-xl font-semibold mb-2">Workspace Not Found</h2>
          <p className="text-gray-600">Please install the Slack app first.</p>
        </div>
      </div>
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slackTeamId: teamId },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white text-center">
          <h1 className="text-2xl font-bold">ThreadExtract</h1>
          <p className="text-slate-300 text-sm mt-1">Configure your workspace</p>
        </div>
        
        <div className="p-8">
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm flex items-center gap-2">
            ✅ Slack connected successfully!
          </div>

          <form action={saveNotionConfig} className="space-y-4">
            <input type="hidden" name="teamId" value={teamId} />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notion Internal Integration Token
              </label>
              <input
                type="password"
                name="notionToken"
                defaultValue={workspace?.notionAccessToken || ""}
                placeholder="secret_..."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">From your Notion Integrations dashboard.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notion Database ID
              </label>
              <input
                type="text"
                name="databaseId"
                defaultValue={workspace?.notionDatabaseId || ""}
                placeholder="e.g., 1234567890abcdef"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">The ID in the URL of your target database.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-4"
            >
              Save Configuration
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
