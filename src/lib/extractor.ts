import { WebClient } from "@slack/web-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { Client as NotionClient } from "@notionhq/client";
import { prisma } from "@/lib/db";
import { safeDecrypt } from "@/lib/crypto";
import { canUseFeature } from "@/lib/billing";
import { markdownToNotionBlocks } from "@/lib/notion";

const GEMINI_TIMEOUT_MS = 15000;
const GROQ_TIMEOUT_MS = 10000;

// Helper to get an array of API keys from a comma-separated env var
function getApiKeys(envVar: string | undefined): string[] {
  if (!envVar) return [];
  return envVar.split(",").map((k) => k.trim()).filter(Boolean);
}

const geminiKeys = getApiKeys(process.env.GEMINI_API_KEYS);
const groqKeys = getApiKeys(process.env.GROQ_API_KEYS);

// Races a promise against a timeout so a hung call falls through to the next
// key/provider instead of blocking the rotation loop indefinitely. This is a
// SOFT timeout — it doesn't cancel the underlying SDK request, it just stops
// waiting on it.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

export interface AiExtractionResult {
  title: string;
  markdown_content: string;
}

export function isValidAiExtractionResult(value: unknown): value is AiExtractionResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    v.title.trim().length > 0 &&
    typeof v.markdown_content === "string" &&
    v.markdown_content.trim().length > 0
  );
}

function buildExtractionPrompt(rawTranscript: string): string {
  return `
      You are an expert technical documentation assistant. You will be provided with a raw, noisy Slack thread.
      Your job is to extract the core knowledge from this thread. Ignore all pleasantries, memes, side-conversations, and dead ends.

      Output a valid JSON object with exactly two keys (DO NOT wrap in markdown ticks, just raw JSON, no other text):
      {
        "title": "A short, professional title for this issue (max 6 words)",
        "markdown_content": "A clean markdown string containing a '### The Problem' section and a '### The Solution' section."
      }

      Slack Thread:
      ${rawTranscript}
    `;
}

// Reusable generation logic with fallback strategy
async function generateContentWithFallback(prompt: string): Promise<string | null> {
  // 1. Try Gemini Keys first
  for (const key of geminiKeys) {
    try {
      console.log("Attempting generation with Gemini...");
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await withTimeout(model.generateContent(prompt), GEMINI_TIMEOUT_MS, "Gemini");
      return result.response.text();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Gemini key failed (${message}). Falling back to next key...`);
    }
  }

  // 2. Try Groq Keys if Gemini fails or exhausts limits
  for (const key of groqKeys) {
    try {
      console.log("Attempting generation with Groq...");
      const groq = new Groq({ apiKey: key });
      const completion = await withTimeout(
        groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama3-8b-8192",
        }),
        GROQ_TIMEOUT_MS,
        "Groq",
      );
      return completion.choices[0]?.message?.content || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Groq key failed (${message}). Falling back to next key...`);
    }
  }

  console.error("All AI generation strategies and keys failed.");
  return null;
}

export interface ExtractAndPublishResult {
  title: string;
  notionPageUrl: string | null;
  notionPageId: string;
}

/**
 * The AI + Notion half of the pipeline, decoupled from Slack — takes an
 * already-fetched transcript rather than fetching one itself. Split out so
 * it can be exercised directly (e.g. an e2e test hitting real Gemini/Groq +
 * real Notion APIs with a canned transcript) without needing a live Slack
 * thread to fetch.
 */
export async function extractAndPublish(opts: {
  workspaceId: string;
  rawTranscript: string;
  notionToken: string;
  notionDatabaseId: string;
}): Promise<ExtractAndPublishResult | null> {
  const prompt = buildExtractionPrompt(opts.rawTranscript);

  const responseText = await generateContentWithFallback(prompt);
  if (!responseText) {
    console.error("Failed to generate content from any AI model.");
    return null;
  }

  // Parse the JSON (handling potential markdown formatting from AI)
  let aiData: unknown;
  try {
    const cleanedJson = responseText.replace(/```json\n?|```/g, "").trim();
    aiData = JSON.parse(cleanedJson);
  } catch {
    console.error("Failed to parse AI response as JSON:", responseText);
    return null;
  }

  if (!isValidAiExtractionResult(aiData)) {
    console.error("AI response failed schema validation:", aiData);
    return null;
  }

  // Push to Notion, with real headings/bullets instead of one flat paragraph
  const notion = new NotionClient({ auth: opts.notionToken });

  const page = await notion.pages.create({
    parent: { database_id: opts.notionDatabaseId },
    properties: {
      title: {
        title: [{ text: { content: aiData.title } }],
      },
    },
    children: markdownToNotionBlocks(aiData.markdown_content),
  });

  const notionPageUrl = "url" in page ? page.url : null;

  // Record usage for the free-tier cap, and keep enough detail for the
  // dashboard's recent-activity feed.
  await prisma.extraction.create({
    data: { workspaceId: opts.workspaceId, title: aiData.title, notionPageUrl },
  });

  return { title: aiData.title, notionPageUrl, notionPageId: page.id };
}

export async function processSlackThread(slackTeamId: string, channelId: string, messageTs: string) {
  try {
    // 1. Fetch workspace credentials
    const workspace = await prisma.workspace.findUnique({
      where: { slackTeamId },
    });

    if (!workspace || !workspace.slackAccessToken || !workspace.notionAccessToken || !workspace.notionDatabaseId) {
      console.error(`Missing credentials for workspace ${slackTeamId}`);
      return;
    }

    // 2. Enforce the plan's usage cap BEFORE any paid AI/Notion API call —
    // this is the actual cost-control point, not just a UI gate.
    if (!(await canUseFeature(workspace))) {
      console.log(`Workspace ${slackTeamId} is over its free-tier extraction cap for this month.`);
      return;
    }

    const slackToken = safeDecrypt(workspace.slackAccessToken);
    const notionToken = safeDecrypt(workspace.notionAccessToken);

    // 3. Fetch the thread from Slack
    const slack = new WebClient(slackToken);
    const repliesRes = await slack.conversations.replies({
      channel: channelId,
      ts: messageTs,
    });

    if (!repliesRes.messages || repliesRes.messages.length === 0) {
      console.log("No messages found in thread.");
      return;
    }

    // Format the conversation for the AI
    const rawTranscript = repliesRes.messages
      .map((m) => `User ${m.user || "Unknown"}: ${m.text}`)
      .join("\n\n");

    // 4-6. AI processing + Notion push + usage recording
    const result = await extractAndPublish({
      workspaceId: workspace.id,
      rawTranscript,
      notionToken,
      notionDatabaseId: workspace.notionDatabaseId,
    });

    if (result) {
      console.log(`Successfully extracted and saved thread ${messageTs} to Notion.`);
    }
  } catch (error) {
    console.error("Error processing slack thread:", error);
  }
}
