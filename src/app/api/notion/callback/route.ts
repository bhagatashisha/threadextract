import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { verifyOAuthState } from "@/lib/claim-token";
import { Client, isHTTPResponseError } from "@notionhq/client";
export async function GET(req: Request) {
  const session = await auth();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  if (!verifyOAuthState(state)) {
    return NextResponse.redirect(new URL("/settings?error=notion_oauth_failed", baseUrl));
  }

  if (error || !code) {
    console.error("Notion OAuth Error:", error);
    return NextResponse.redirect(new URL("/settings?error=notion_oauth_failed", baseUrl));
  }

  const clientId = process.env.NOTION_CLIENT_ID!;
  const clientSecret = process.env.NOTION_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/notion/callback`;

  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  try {
    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${encoded}`
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Notion token exchange failed:", data);
      return NextResponse.redirect(new URL("/settings?error=notion_token_failed", baseUrl));
    }

    const accessToken = data.access_token;
    
    const workspace = await prisma.workspace.findFirst({
      where: { ownerUserId: session.user.id }
    });

    const notion = new Client({ auth: accessToken });
    let finalDbId: string | null = null;

    // 1. Try to reuse the existing database if it is still valid
    if (workspace?.notionDatabaseId) {
      try {
        const existingDb = await notion.databases.retrieve({ database_id: workspace.notionDatabaseId });
        if (existingDb && existingDb.object === "database") {
          finalDbId = existingDb.id;
        }
      } catch {
        // Ignored. The DB was deleted or access was revoked. We will create a new one.
      }
    }

    // 2. If no valid database exists, create a new one automatically
    if (!finalDbId) {
      // Find a parent page
      const searchRes = await notion.search({
        filter: {
          value: "page",
          property: "object"
        }
      });
      
      const parentPage = searchRes.results.find(r => r.object === "page");
      if (!parentPage) {
        return NextResponse.redirect(new URL("/settings?error=no_pages", baseUrl));
      }

      try {
        const newDb = await notion.databases.create({
          parent: {
            type: "page_id",
            page_id: parentPage.id
          },
          title: [
            {
              type: "text",
              text: {
                content: "Extracted Slack Threads"
              }
            }
          ]
        });
        finalDbId = newDb.id;
      } catch (err) {
        console.error("Failed to create Notion database:", err);
        // If it throws 403 or 404, the integration likely lacks "Insert Content" capabilities
        if (
          isHTTPResponseError(err) &&
          (err.status === 403 || err.status === 404 || err.code === "object_not_found" || err.code === "restricted_resource")
        ) {
          return NextResponse.redirect(new URL("/settings?error=missing_insert", baseUrl));
        }
        return NextResponse.redirect(new URL("/settings?error=notion_db_create_failed", baseUrl));
      }
    }

    if (workspace && finalDbId) {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          notionAccessToken: encrypt(accessToken),
          notionDatabaseId: finalDbId,
        }
      });
    }

    return NextResponse.redirect(new URL("/settings", baseUrl));
  } catch (err) {
    console.error("Error during Notion OAuth:", err);
    return NextResponse.redirect(new URL("/settings?error=notion_oauth_error", baseUrl));
  }
}
