import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Workspace } from "@prisma/client";
import type { Session } from "next-auth";

/**
 * Resolves the signed-in user's owned workspace. Redirects to /login if
 * signed out, or to /dashboard's "no workspace connected" empty state if
 * signed in but no workspace is owned yet. One owner per workspace — see
 * the pricing-model decision in the hardening plan for why there's no
 * multi-user Membership layer here.
 */
export async function requireWorkspaceContext(
  callbackPath: string,
): Promise<{ user: NonNullable<Session["user"]>; workspace: Workspace }> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: session.user.id },
  });

  if (!workspace) {
    redirect("/dashboard");
  }

  return { user: session.user, workspace };
}
