import { test, expect } from "@playwright/test";
import { Client as NotionClient } from "@notionhq/client";
import { createWorkspace, cleanup, prisma } from "./helpers/db";
import { extractAndPublish } from "../src/lib/extractor";

const NOTION_TOKEN = process.env.E2E_NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.E2E_NOTION_DATABASE_ID;
const HAS_AI_KEY = Boolean(process.env.GEMINI_API_KEYS || process.env.GROQ_API_KEYS);
const CONFIGURED = Boolean(NOTION_TOKEN && NOTION_DATABASE_ID && HAS_AI_KEY);

const SAMPLE_TRANSCRIPT = `
User A: Our deploy pipeline keeps failing on the "build-assets" step with an ENOSPC (no space left on device) error.
User B: Try clearing the CI runner's /tmp docker layer cache before the build step — that's almost always a stale-cache disk issue, not an actual capacity problem.
User A: That fixed it. Added a cache-clear step right before build-assets and it's been green since.
User C: lol anyone want to grab lunch, new taco place opened up
User A: Also worth noting — we should probably add a scheduled cache-clear so this doesn't recur every few weeks.
`.trim();

test.describe("AI -> Notion round trip (real external APIs)", () => {
  test.skip(
    !CONFIGURED,
    "Requires E2E_NOTION_TOKEN, E2E_NOTION_DATABASE_ID, and GEMINI_API_KEYS or GROQ_API_KEYS — set via .env.test.local. See README.",
  );

  test("a real transcript produces a real Notion page with real heading/paragraph blocks", async () => {
    test.setTimeout(45_000); // real AI + real Notion API calls, not mocked

    const workspace = await createWorkspace({});
    let createdPageId: string | null = null;

    try {
      const result = await extractAndPublish({
        workspaceId: workspace.id,
        rawTranscript: SAMPLE_TRANSCRIPT,
        notionToken: NOTION_TOKEN!,
        notionDatabaseId: NOTION_DATABASE_ID!,
      });

      expect(result).not.toBeNull();
      expect(result!.title.trim().length).toBeGreaterThan(0);
      expect(result!.notionPageUrl).toMatch(/^https:\/\/(www\.)?notion\.so\//);
      createdPageId = result!.notionPageId;

      // The Extraction row the dashboard's recent-activity feed reads from.
      const extraction = await prisma.extraction.findFirst({ where: { workspaceId: workspace.id } });
      expect(extraction?.title).toBe(result!.title);
      expect(extraction?.notionPageUrl).toBe(result!.notionPageUrl);

      // Confirm Notion's real API actually accepted our block shapes — not
      // just that our own types compiled. A heading_3 proves
      // markdownToNotionBlocks' output survived a real round trip, not just
      // an internal type check.
      const notion = new NotionClient({ auth: NOTION_TOKEN! });
      const children = await notion.blocks.children.list({ block_id: createdPageId });
      const blockTypes = children.results.map((b) => ("type" in b ? b.type : "unknown"));
      expect(blockTypes).toContain("heading_3");
      expect(blockTypes).toContain("paragraph");
    } finally {
      if (createdPageId) {
        // Archive rather than hard-delete — avoids leaving test junk behind
        // in a real database on every run without needing "delete" scope.
        const notion = new NotionClient({ auth: NOTION_TOKEN! });
        await notion.pages.update({ page_id: createdPageId, archived: true }).catch(() => {});
      }
      await cleanup({ workspaceId: workspace.id });
    }
  });
});
