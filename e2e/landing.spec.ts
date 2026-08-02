import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("renders hero, pricing, and a valid Add to Slack link", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /turn messy slack threads/i })).toBeVisible();

    const addToSlack = page.getByRole("link", { name: "Add to Slack" }).first();
    await expect(addToSlack).toBeVisible();
    const href = await addToSlack.getAttribute("href");
    expect(href).toContain("https://slack.com/oauth/v2/authorize");
    expect(href).toContain(`client_id=${process.env.SLACK_CLIENT_ID}`);
    expect(href).toContain("redirect_uri=");
    expect(href).toContain("state=");

    // Pricing section
    await expect(page.getByRole("heading", { name: /simple, workspace-wide pricing/i })).toBeVisible();
    await expect(page.getByText("$0", { exact: true })).toBeVisible();
    await expect(page.getByText("$29/mo")).toBeVisible();
  });

  test("Add to Slack link carries a fresh, distinct state on each load", async ({ page }) => {
    await page.goto("/");
    const first = await page.getByRole("link", { name: "Add to Slack" }).first().getAttribute("href");

    await page.reload();
    const second = await page.getByRole("link", { name: "Add to Slack" }).first().getAttribute("href");

    expect(first).not.toEqual(second);
  });

  test("Sign in link goes to /login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  });
});
