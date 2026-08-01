import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

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

    if (!slackData.ok) {
      console.error("Slack OAuth Error:", slackData);
      return NextResponse.json({ error: "Failed to authorize Slack" }, { status: 400 });
    }

    // Save or update the Workspace in our database
    await prisma.workspace.upsert({
      where: {
        slackTeamId: slackData.team.id,
      },
      update: {
        slackAccessToken: slackData.access_token,
      },
      create: {
        slackTeamId: slackData.team.id,
        slackAccessToken: slackData.access_token,
      },
    });

    // Redirect the user to the dashboard to configure Notion
    const dashboardUrl = new URL("/dashboard", req.url);
    dashboardUrl.searchParams.set("team_id", slackData.team.id);
    
    return NextResponse.redirect(dashboardUrl);

  } catch (error) {
    console.error("Error during Slack OAuth:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
