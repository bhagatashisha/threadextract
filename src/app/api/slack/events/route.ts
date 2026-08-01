import { NextResponse } from "next/server";
import { processSlackThread } from "@/lib/extractor";
import crypto from "crypto";

// Helper to verify requests are actually from Slack
function verifySlackRequest(request: Request, bodyText: string) {
  const slackSignature = request.headers.get("x-slack-signature");
  const slackTimestamp = request.headers.get("x-slack-request-timestamp");
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!slackSignature || !slackTimestamp || !signingSecret) {
    return false;
  }

  // Prevent replay attacks
  if (Math.abs(Math.floor(Date.now() / 1000) - parseInt(slackTimestamp)) > 60 * 5) {
    return false;
  }

  const sigBasestring = `v0:${slackTimestamp}:${bodyText}`;
  const mySignature = "v0=" + crypto.createHmac("sha256", signingSecret).update(sigBasestring, "utf8").digest("hex");
  
  return crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature));
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    
    // Slack requires us to verify their webhook requests for security
    // if (!verifySlackRequest(req, rawBody)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = JSON.parse(rawBody);

    // 1. URL Verification (Slack requires this when setting up the webhook)
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // 2. Handle the reaction_added event
    if (body.type === "event_callback" && body.event.type === "reaction_added") {
      const { reaction, item, item_user } = body.event;
      
      // Only trigger if the reaction is the brain emoji
      if (reaction === "brain" && item.type === "message") {
        
        // IMPORTANT: We do not `await` this! 
        // Slack requires a 200 OK within 3 seconds. We kick off the AI process in the background.
        // On EC2 / standard node environments, this fire-and-forget promise works perfectly.
        processSlackThread(body.team_id, item.channel, item.ts).catch(console.error);
        
      }
    }

    // Always acknowledge the event immediately to prevent Slack from retrying
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error("Error in Slack events webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
