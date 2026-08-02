"use server";

import { signOut } from "@/lib/auth";

/**
 * Sign-out server action, pulled out of inline JSX. Inline server actions
 * inside layouts have unreliably propagated the NextAuth redirect on this
 * Next.js version — a named action file is the recommended, reliable form.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
