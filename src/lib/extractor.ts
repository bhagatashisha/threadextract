import { WebClient } from "@slack/web-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { Client as NotionClient } from "@notionhq/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to get an array of API keys from a comma-separated env var
function getApiKeys(envVar: string | undefined): string[] {
  if (!envVar) return [];
  return envVar.split(",").map((k) => k.trim()).filter(Boolean);
}

const geminiKeys = getApiKeys(process.env.GEMINI_API_KEYS);
const groqKeys = getApiKeys(process.env.GROQ_API_KEYS);

// Reusable generation logic with fallback strategy
async function generateContentWithFallback(prompt: string): Promise<string | null> {
  // 1. Try Gemini Keys first
  for (const key of geminiKeys) {
    try {
      console.log("Attempting generation with Gemini...");
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.warn(`Gemini key failed (${error?.message}). Falling back to next key...`);
    }
  }

  // 2. Try Groq Keys if Gemini fails or exhausts limits
  for (const key of groqKeys) {
    try {
      console.log("Attempting generation with Groq...");
      const groq = new Groq({ apiKey: key });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-8b-8192", 
      });
      return completion.choices[0]?.message?.content || null;
    } catch (error: any) {
      console.warn(`Groq key failed (${error?.message}). Falling back to next key...`);
    }
  }

  console.error("All AI generation strategies and keys failed.");
  return null;
}

export async function processSlackThread(
  slackTeamId: string,
  channelId: string,
  messageTs: string
) {
  try {
    // 1. Fetch workspace credentials
    const workspace = await prisma.workspace.findUnique({
      where: { slackTeamId },
    });

    if (!workspace || !workspace.slackAccessToken || !workspace.notionAccessToken || !workspace.notionDatabaseId) {
      console.error(`Missing credentials for workspace ${slackTeamId}`);
      return;
    }

    // 2. Fetch the thread from Slack
    const slack = new WebClient(workspace.slackAccessToken);
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
      .map((m) => `User ${m.user || 'Unknown'}: ${m.text}`)
      .join("\n\n");

    const prompt = `
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

    // 3. AI Processing (Fallback Logic)
    const responseText = await generateContentWithFallback(prompt);
    
    if (!responseText) {
      console.error("Failed to generate content from any AI model.");
      return;
    }

    // Parse the JSON (handling potential markdown formatting from AI)
    let aiData;
    try {
      const cleanedJson = responseText.replace(/```json\n?|```/g, "").trim();
      aiData = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", responseText);
      return;
    }

    // 4. Push to Notion
    const notion = new NotionClient({ auth: workspace.notionAccessToken });
    
    await notion.pages.create({
      parent: { database_id: workspace.notionDatabaseId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: aiData.title || "Extracted Slack Thread",
              },
            },
          ],
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: aiData.markdown_content || "No content extracted.",
                },
              },
            ],
          },
        },
      ],
    });

    console.log(`Successfully extracted and saved thread ${messageTs} to Notion.`);
  } catch (error) {
    console.error("Error processing slack thread:", error);
  }
}
