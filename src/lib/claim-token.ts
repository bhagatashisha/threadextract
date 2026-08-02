import crypto from "crypto";

// Short-lived, self-verifying HMAC tokens. Two uses, one primitive:
//  - workspace claim: binds a freshly-Slack-installed (unowned) Workspace to
//    whichever user completes login next.
//  - OAuth CSRF state: proves the /api/slack/oauth callback corresponds to a
//    request this server issued recently. No session store exists (by
//    design), so this self-verifying token substitutes for server-side state.

const CLAIM_TTL_MS = 30 * 60 * 1000; // 30 minutes
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getSecret(): string {
  const secret = process.env.CLAIM_TOKEN_SECRET;
  if (!secret) {
    throw new Error("CLAIM_TOKEN_SECRET is not set");
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signWorkspaceClaim(workspaceId: string, ttlMs: number = CLAIM_TTL_MS): string {
  const expiry = Date.now() + ttlMs;
  const payload = `${workspaceId}.${expiry}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyWorkspaceClaim(token: string): { workspaceId: string } | null {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const parts = decoded.split(".");
  if (parts.length !== 3) return null;
  const [workspaceId, expiryStr, sig] = parts;
  if (!workspaceId || !/^\d+$/.test(expiryStr)) return null;

  const expected = sign(`${workspaceId}.${expiryStr}`);
  if (!timingSafeEqualStrings(expected, sig)) return null;

  if (Date.now() > Number(expiryStr)) return null;

  return { workspaceId };
}

export function signOAuthState(ttlMs: number = OAUTH_STATE_TTL_MS): string {
  const expiry = Date.now() + ttlMs;
  const payload = `${expiry}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyOAuthState(state: string | null | undefined): boolean {
  if (!state) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const parts = decoded.split(".");
  if (parts.length !== 2) return false;
  const [expiryStr, sig] = parts;
  if (!/^\d+$/.test(expiryStr)) return false;

  const expected = sign(expiryStr);
  if (!timingSafeEqualStrings(expected, sig)) return false;

  return Date.now() <= Number(expiryStr);
}
