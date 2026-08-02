import { test, expect } from "@playwright/test";
import { createUser, createWorkspace, cleanup, prisma } from "./helpers/db";
import { loginAs } from "./helpers/auth";
import { signWorkspaceClaim } from "../src/lib/claim-token";

test.describe("Workspace claim flow", () => {
  test("valid token, no session, redirects through /login and back", async ({ page, context, baseURL }) => {
    const workspace = await createWorkspace({});
    const user = await createUser();
    try {
      const token = signWorkspaceClaim(workspace.id);
      await page.goto(`/claim?token=${token}`);
      await expect(page).toHaveURL(/\/login\?callbackUrl=/);

      // Now sign in and follow the same claim link again, as the redirect chain would.
      await loginAs(context, user.id, baseURL!);
      await page.goto(`/claim?token=${token}`);
      await expect(page).toHaveURL(/\/dashboard/);

      const updated = await prisma.workspace.findUnique({ where: { id: workspace.id } });
      expect(updated?.ownerUserId).toBe(user.id);
    } finally {
      await cleanup({ userId: user.id, workspaceId: workspace.id });
    }
  });

  test("tampered token is rejected with a clear error, not a crash", async ({ page }) => {
    const workspace = await createWorkspace({});
    try {
      const token = signWorkspaceClaim(workspace.id);
      const tampered = token.slice(0, -2) + (token.slice(-2) === "AA" ? "BB" : "AA");
      await page.goto(`/claim?token=${tampered}`);
      await expect(page.getByRole("heading", { name: /link expired or invalid/i })).toBeVisible();
    } finally {
      await cleanup({ workspaceId: workspace.id });
    }
  });

  test("expired token is rejected", async ({ page }) => {
    const workspace = await createWorkspace({});
    try {
      const token = signWorkspaceClaim(workspace.id, -1);
      await page.goto(`/claim?token=${token}`);
      await expect(page.getByRole("heading", { name: /link expired or invalid/i })).toBeVisible();
    } finally {
      await cleanup({ workspaceId: workspace.id });
    }
  });

  test("claiming a workspace already owned by a different account is rejected, not reassigned", async ({
    page,
    context,
    baseURL,
  }) => {
    const originalOwner = await createUser();
    const attacker = await createUser();
    const workspace = await createWorkspace({ ownerUserId: originalOwner.id });
    try {
      const token = signWorkspaceClaim(workspace.id);
      await loginAs(context, attacker.id, baseURL!);
      await page.goto(`/claim?token=${token}`);

      await expect(page.getByRole("heading", { name: /already connected to another account/i })).toBeVisible();

      const unchanged = await prisma.workspace.findUnique({ where: { id: workspace.id } });
      expect(unchanged?.ownerUserId).toBe(originalOwner.id);
    } finally {
      await cleanup({ userId: originalOwner.id, workspaceId: workspace.id });
      await cleanup({ userId: attacker.id });
    }
  });

  test("re-claiming your own already-owned workspace is a no-op success, not an error", async ({
    page,
    context,
    baseURL,
  }) => {
    const user = await createUser();
    const workspace = await createWorkspace({ ownerUserId: user.id });
    try {
      const token = signWorkspaceClaim(workspace.id);
      await loginAs(context, user.id, baseURL!);
      await page.goto(`/claim?token=${token}`);
      await expect(page).toHaveURL(/\/dashboard/);
    } finally {
      await cleanup({ userId: user.id, workspaceId: workspace.id });
    }
  });
});
