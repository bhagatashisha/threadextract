import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { signOAuthState } from "@/lib/claim-token";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?callbackUrl=/settings", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/notion/callback`;

  if (!clientId) {
    console.error("NOTION_CLIENT_ID is not set in environment variables");
    return NextResponse.redirect(new URL("/settings?error=missing_notion_config", baseUrl));
  }

  // CSRF protection: binds the callback to a request this server issued to
  // this signed-in user recently, the same way /api/slack/oauth's `state`
  // does — without it, an attacker can start their own Notion OAuth flow,
  // get a `code`, and trick a logged-in victim into hitting the callback
  // with it, linking the victim's workspace to the attacker's Notion account.
  const state = signOAuthState();

  const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(notionAuthUrl);
}
