import type { BrowserContext } from "@playwright/test";
import { createSessionForUser } from "./db";

/**
 * Logs a Playwright browser context in as `userId` by seeding a real
 * Auth.js database Session row and injecting its cookie directly — bypasses
 * the actual Google/Resend sign-in UI, which can't be driven reliably in
 * automated tests. Cookie name/attributes match Auth.js v5's defaults for a
 * non-HTTPS host (see @auth/core/lib/utils/cookie.js): no "__Secure-"
 * prefix over plain http://localhost.
 */
export async function loginAs(context: BrowserContext, userId: string, baseURL: string): Promise<void> {
  const sessionToken = await createSessionForUser(userId);
  const url = new URL(baseURL);
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
  ]);
}
