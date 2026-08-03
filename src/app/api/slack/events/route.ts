import { NextResponse } from "next/server";
import { processSlackThread } from "@/lib/extractor";
import { verifySlackRequest } from "@/lib/slack-verify";

// Health-check endpoint so we can verify the route is reachable
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    if (!verifySlackRequest(req, rawBody)) {
      console.warn("[SLACK-EVENTS] Signature verification failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // 1. URL Verification (Slack requires this when setting up the webhook)
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // 2. Handle the reaction_added event
    if (body.type === "event_callback") {
      const event = body.event;

      if (!event || typeof event !== "object") {
        console.warn("[SLACK-EVENTS] event_callback with missing/invalid event payload");
        return NextResponse.json({ ok: true });
      }

      if (event.type === "reaction_added") {
        const { reaction, item } = event;

        const isValidItem =
          item &&
          typeof item === "object" &&
          item.type === "message" &&
          typeof item.channel === "string" &&
          item.channel.length > 0 &&
          typeof item.ts === "string" &&
          item.ts.length > 0;

        if (typeof reaction !== "string") {
          console.warn("[SLACK-EVENTS] reaction_added event missing reaction field");
        } else if (typeof body.team_id !== "string" || body.team_id.length === 0) {
          console.warn("[SLACK-EVENTS] event_callback missing team_id");
        } else if (isValidItem) {
          processSlackThread(body.team_id, item.channel, item.ts, reaction, event.user).catch(console.error);
        } else {
          console.warn("[SLACK-EVENTS] Invalid item in reaction_added event");
        }
      }
    }

    // Always acknowledge the event immediately to prevent Slack from retrying
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[SLACK-EVENTS] Error in Slack events webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
