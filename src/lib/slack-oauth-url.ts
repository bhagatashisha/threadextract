import { signOAuthState } from "@/lib/claim-token";

const SCOPES = "channels:history,groups:history,im:history,mpim:history,reactions:read,chat:write";

/** Builds the "Add to Slack" URL with a fresh signed CSRF state — call per-request, never cache. */
export function buildSlackOAuthUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const state = signOAuthState();
  return `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/slack/oauth`)}&state=${encodeURIComponent(state)}`;
}
