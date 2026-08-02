import { NextResponse } from "next/server";
import { processSlackThread } from "@/lib/extractor";
import { verifySlackRequest } from "@/lib/slack-verify";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    if (!verifySlackRequest(req, rawBody)) {
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
        console.warn("event_callback with missing/invalid event payload", body);
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
          console.warn("reaction_added event missing reaction field", event);
        } else if (typeof body.team_id !== "string" || body.team_id.length === 0) {
          console.warn("event_callback missing team_id", body);
        } else if (reaction === "brain" && isValidItem) {
          // IMPORTANT: We do not `await` this!
          // Slack requires a 200 OK within 3 seconds. We kick off the AI process in the background.
          // On EC2 / standard node environments, this fire-and-forget promise works perfectly.
          processSlackThread(body.team_id, item.channel, item.ts).catch(console.error);
        }
      }
    }

    // Always acknowledge the event immediately to prevent Slack from retrying
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in Slack events webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
