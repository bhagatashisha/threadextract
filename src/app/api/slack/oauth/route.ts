import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { verifyOAuthState, signWorkspaceClaim } from "@/lib/claim-token";

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!verifyOAuthState(state)) {
    return NextResponse.json({ error: "Invalid or expired OAuth state" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  try {
    // Exchange the authorization code for an access token
    const slackRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID || "",
        client_secret: process.env.SLACK_CLIENT_SECRET || "",
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || "https://threadextract-uat.korrali.com"}/api/slack/oauth`,
      }),
    });

    const slackData = await slackRes.json();

    if (!slackData.ok || !slackData.team?.id) {
      console.error("Slack OAuth Error:", slackData);
      return NextResponse.json({ error: "Failed to authorize Slack" }, { status: 400 });
    }

    // Save or update the Workspace in our database. Trial is only granted on
    // first install — reinstalling an existing workspace must not reset it.
    const workspace = await prisma.workspace.upsert({
      where: {
        slackTeamId: slackData.team.id,
      },
      update: {
        slackAccessToken: encrypt(slackData.access_token),
      },
      create: {
        slackTeamId: slackData.team.id,
        slackAccessToken: encrypt(slackData.access_token),
        pricingTier: "TRIAL",
        trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
      },
    });

    // Slack's OAuth response tells us which Slack team installed the app,
    // not which human is at the browser — send them through a claim step
    // that binds this workspace to whichever account they sign in with.
    //
    // Built from NEXT_PUBLIC_BASE_URL rather than req.url: behind the
    // nginx/EC2 reverse proxy, req.url reflects the internal
    // localhost:PORT address Next.js actually received the request on,
    // not the public hostname — redirecting to that sends the browser to
    // an address it can't reach.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://threadextract-uat.korrali.com";
    const claimUrl = new URL("/claim", baseUrl);
    claimUrl.searchParams.set("token", signWorkspaceClaim(workspace.id));

    return NextResponse.redirect(claimUrl);
  } catch (error) {
    console.error("Error during Slack OAuth:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
