import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyWorkspaceClaim } from "@/lib/claim-token";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{message}</p>
          <Link href="/" className="text-foreground underline underline-offset-4">
            Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <ErrorCard
        title="Missing claim link"
        message="This link is missing required information. Please reinstall the Slack app to try again."
      />
    );
  }

  const claim = verifyWorkspaceClaim(token);
  if (!claim) {
    return (
      <ErrorCard
        title="Link expired or invalid"
        message="This connection link has expired or is invalid. Please reinstall the Slack app to get a fresh link."
      />
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/claim?token=${token}`)}`);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: claim.workspaceId },
  });

  if (!workspace) {
    return (
      <ErrorCard
        title="Workspace not found"
        message="We couldn't find the Slack workspace for this link. Please reinstall the app to try again."
      />
    );
  }

  if (workspace.ownerUserId && workspace.ownerUserId !== session.user.id) {
    return (
      <ErrorCard
        title="Already connected to another account"
        message="This Slack workspace is already connected to a different ThreadExtract account. Contact support if this seems wrong."
      />
    );
  }

  if (!workspace.ownerUserId) {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { ownerUserId: session.user.id },
    });
  }

  redirect("/dashboard");
}
