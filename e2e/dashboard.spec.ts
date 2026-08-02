import { test, expect } from "@playwright/test";
import { createUser, createWorkspace, createExtraction, cleanup } from "./helpers/db";
import { loginAs } from "./helpers/auth";

test.describe("Dashboard", () => {
  test("no workspace connected shows an inline Add to Slack CTA, not a dead end", async ({
    page,
    context,
    baseURL,
  }) => {
    const user = await createUser();
    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/dashboard");

      await expect(page.getByRole("heading", { name: "No workspace connected" })).toBeVisible();
      const cta = page.getByRole("link", { name: "Add to Slack" });
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute("href", /slack\.com\/oauth\/v2\/authorize/);
    } finally {
      await cleanup({ userId: user.id });
    }
  });

  test("connected workspace on trial, Notion not yet configured", async ({ page, context, baseURL }) => {
    const user = await createUser();
    const workspace = await createWorkspace({
      ownerUserId: user.id,
      pricingTier: "TRIAL",
      trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });
    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/dashboard");

      await expect(page.getByText(workspace.slackTeamId)).toBeVisible();
      await expect(page.getByText("Connected").first()).toBeVisible();
      await expect(page.getByText("Setup needed")).toBeVisible();
      await expect(page.getByText(/plan: trial/i)).toBeVisible();
      await expect(page.getByText(/5 days remaining/i)).toBeVisible();

      // Recent extractions empty state
      await expect(page.getByText(/no extractions yet/i)).toBeVisible();
    } finally {
      await cleanup({ userId: user.id, workspaceId: workspace.id });
    }
  });

  test("connected workspace, Notion configured, Free tier usage shown", async ({ page, context, baseURL }) => {
    const user = await createUser();
    const workspace = await createWorkspace({
      ownerUserId: user.id,
      pricingTier: "FREE",
      trialEndsAt: new Date(Date.now() - 1000),
      notionAccessToken: "secret_fake_notion_token",
      notionDatabaseId: "abc123",
    });
    await createExtraction({ workspaceId: workspace.id, title: "How to fix the flaky deploy" });
    await createExtraction({ workspaceId: workspace.id, title: "Postgres connection pool exhaustion" });

    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/dashboard");

      await expect(page.getByText(/plan: free/i)).toBeVisible();
      await expect(page.getByText(/2 of 5 free extractions used/i)).toBeVisible();

      // Notion status badge should read Connected, not Setup needed
      const notionCard = page.getByText("Notion database").locator("..");
      await expect(notionCard.getByText("Connected")).toBeVisible();

      // Recent extractions list
      await expect(page.getByText("How to fix the flaky deploy")).toBeVisible();
      await expect(page.getByText("Postgres connection pool exhaustion")).toBeVisible();
      await expect(page.getByRole("link", { name: /open/i }).first()).toHaveAttribute(
        "href",
        "https://notion.so/fake-page",
      );
    } finally {
      await cleanup({ userId: user.id, workspaceId: workspace.id });
    }
  });

  test("saving the Notion configuration form persists to the database", async ({ page, context, baseURL }) => {
    const user = await createUser();
    const workspace = await createWorkspace({ ownerUserId: user.id, pricingTier: "TRIAL" });

    try {
      await loginAs(context, user.id, baseURL!);
      await page.goto("/dashboard");

      await page.getByLabel(/notion internal integration token/i).fill("secret_new_token_value");
      await page.getByLabel(/notion database id/i).fill("new-db-id-123");
      await page.getByRole("button", { name: /save configuration/i }).click();

      await expect(page.getByLabel(/notion database id/i)).toHaveValue("new-db-id-123");

      const notionCard = page.getByText("Notion database").locator("..");
      await expect(notionCard.getByText("Connected")).toBeVisible();
    } finally {
      await cleanup({ userId: user.id, workspaceId: workspace.id });
    }
  });

  test("a user with no owned workspace cannot see another account's data (IDOR regression)", async ({
    page,
    context,
    baseURL,
  }) => {
    const ownerUser = await createUser();
    const otherUser = await createUser();
    const workspace = await createWorkspace({
      ownerUserId: ownerUser.id,
      notionAccessToken: "secret_owner_token",
      notionDatabaseId: "owner-db",
    });

    try {
      await loginAs(context, otherUser.id, baseURL!);
      await page.goto("/dashboard");

      await expect(page.getByRole("heading", { name: "No workspace connected" })).toBeVisible();
      await expect(page.getByText(workspace.slackTeamId)).not.toBeVisible();
      await expect(page.getByText("owner-db")).not.toBeVisible();
    } finally {
      await cleanup({ userId: ownerUser.id, workspaceId: workspace.id });
      await cleanup({ userId: otherUser.id });
    }
  });
});
