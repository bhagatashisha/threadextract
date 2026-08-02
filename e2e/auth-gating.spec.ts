import { test, expect } from "@playwright/test";
import { createUser, cleanup } from "./helpers/db";
import { loginAs } from "./helpers/auth";

test.describe("Auth gating", () => {
  test("unauthenticated /dashboard redirects to /login with a callbackUrl", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });

  test("unauthenticated /billing redirects to /login", async ({ page }) => {
    await page.goto("/billing");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated /claim with no token shows an error, not a crash", async ({ page }) => {
    await page.goto("/claim");
    await expect(page.getByText(/missing claim link/i)).toBeVisible();
  });

  test("a signed-in user visiting / is redirected straight to /dashboard", async ({ page, context, baseURL }) => {
    const user = await createUser();
    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/");
      await expect(page).toHaveURL(/\/dashboard/);
    } finally {
      await cleanup({ userId: user.id });
    }
  });

  test("a signed-in user visiting /login is redirected to /dashboard", async ({ page, context, baseURL }) => {
    const user = await createUser();
    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/login");
      await expect(page).toHaveURL(/\/dashboard/);
    } finally {
      await cleanup({ userId: user.id });
    }
  });
});
