import { NextResponse } from "next/server";
import { processSlackThread } from "@/lib/extractor";
import { verifySlackRequest } from "@/lib/slack-verify";

// Health-check endpoint so we can verify the route is reachable
export async function GET() {
  console.log("[SLACK-EVENTS] GET health check hit");
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}

export async function POST(req: Request) {
  console.log("[SLACK-EVENTS] *** POST received ***");
  try {
    const rawBody = await req.text();
    console.log("[SLACK-EVENTS] Raw body length:", rawBody.length);
    console.log("[SLACK-EVENTS] Headers:", JSON.stringify({
      "x-slack-signature": req.headers.get("x-slack-signature") ? "present" : "missing",
      "x-slack-request-timestamp": req.headers.get("x-slack-request-timestamp"),
      "content-type": req.headers.get("content-type"),
      "user-agent": req.headers.get("user-agent"),
    }));

    if (!verifySlackRequest(req, rawBody)) {
      console.warn("[SLACK-EVENTS] Signature verification FAILED");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[SLACK-EVENTS] Signature verification PASSED");

    const body = JSON.parse(rawBody);
    console.log("[SLACK-EVENTS] Event type:", body.type, "| team_id:", body.team_id);

    // 1. URL Verification (Slack requires this when setting up the webhook)
    if (body.type === "url_verification") {
      console.log("[SLACK-EVENTS] URL verification challenge received");
      return NextResponse.json({ challenge: body.challenge });
    }

    // 2. Handle the reaction_added event
    if (body.type === "event_callback") {
      const event = body.event;
      console.log("[SLACK-EVENTS] event_callback received, event.type:", event?.type, "| reaction:", event?.reaction);

      if (!event || typeof event !== "object") {
        console.warn("[SLACK-EVENTS] event_callback with missing/invalid event payload", body);
        return NextResponse.json({ ok: true });
      }

      if (event.type === "reaction_added") {
        const { reaction, item } = event;
        console.log("[SLACK-EVENTS] reaction_added:", reaction, "| channel:", item?.channel, "| ts:", item?.ts);

        const isValidItem =
          item &&
          typeof item === "object" &&
          item.type === "message" &&
          typeof item.channel === "string" &&
          item.channel.length > 0 &&
          typeof item.ts === "string" &&
          item.ts.length > 0;

        if (typeof reaction !== "string") {
          console.warn("[SLACK-EVENTS] reaction_added event missing reaction field", event);
        } else if (typeof body.team_id !== "string" || body.team_id.length === 0) {
          console.warn("[SLACK-EVENTS] event_callback missing team_id", body);
        } else if (isValidItem) {
          console.log("[SLACK-EVENTS] Kicking off processSlackThread for team:", body.team_id, "reaction:", reaction);
          processSlackThread(body.team_id, item.channel, item.ts, reaction).catch(console.error);
        } else {
          console.warn("[SLACK-EVENTS] Invalid item in reaction_added:", JSON.stringify(item));
        }
      } else {
        console.log("[SLACK-EVENTS] Ignoring non-reaction event type:", event.type);
      }
    }

    // Always acknowledge the event immediately to prevent Slack from retrying
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[SLACK-EVENTS] Error in Slack events webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
