import crypto from "crypto";

const REPLAY_WINDOW_SECONDS = 60 * 5;

/** Verifies a Slack Events API request came from Slack (HMAC-SHA256, timing-safe, replay-window checked). */
export function verifySlackRequest(request: Request, bodyText: string): boolean {
  const slackSignature = request.headers.get("x-slack-signature");
  const slackTimestamp = request.headers.get("x-slack-request-timestamp");
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!slackSignature || !slackTimestamp || !signingSecret) {
    return false;
  }

  if (Math.abs(Math.floor(Date.now() / 1000) - parseInt(slackTimestamp, 10)) > REPLAY_WINDOW_SECONDS) {
    return false;
  }

  const sigBasestring = `v0:${slackTimestamp}:${bodyText}`;
  const mySignature =
    "v0=" + crypto.createHmac("sha256", signingSecret).update(sigBasestring, "utf8").digest("hex");

  const expected = Buffer.from(mySignature);
  const provided = Buffer.from(slackSignature);
  if (expected.length !== provided.length) return false;

  return crypto.timingSafeEqual(expected, provided);
}
