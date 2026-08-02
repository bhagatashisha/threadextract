import type { BlockObjectRequest } from "@notionhq/client";

// Real markdown -> Notion blocks conversion. The AI is prompted to produce
// "### The Problem" / "### The Solution" headings plus prose/bullets — this
// used to be dumped into one flat paragraph block, which rendered the
// literal "###"/"-" characters instead of real headings/lists in Notion.

const NOTION_RICH_TEXT_LIMIT = 1900; // Notion's real cap is ~2000; leave headroom.

export function chunkText(text: string, maxLen: number = NOTION_RICH_TEXT_LIMIT): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let splitAt = remaining.lastIndexOf(" ", maxLen);
    if (splitAt <= 0) splitAt = maxLen; // no whitespace found — hard cut
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

function richText(content: string) {
  return [{ type: "text" as const, text: { content } }];
}

function headingBlocks(text: string): BlockObjectRequest[] {
  return chunkText(text).map((chunk) => ({
    object: "block",
    type: "heading_3",
    heading_3: { rich_text: richText(chunk) },
  }));
}

function bulletBlocks(text: string): BlockObjectRequest[] {
  return chunkText(text).map((chunk) => ({
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: richText(chunk) },
  }));
}

function paragraphBlocks(text: string): BlockObjectRequest[] {
  return chunkText(text).map((chunk) => ({
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: richText(chunk) },
  }));
}

export function markdownToNotionBlocks(markdown: string): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    const text = paragraphBuffer.join("\n").trim();
    paragraphBuffer = [];
    if (text.length > 0) {
      blocks.push(...paragraphBlocks(text));
    }
  }

  const lines = markdown.split("\n");
  for (const line of lines) {
    const headingMatch = line.match(/^###\s+(.+)/);
    const bulletMatch = line.match(/^[-*]\s+(.+)/);

    if (headingMatch) {
      flushParagraph();
      blocks.push(...headingBlocks(headingMatch[1].trim()));
    } else if (bulletMatch) {
      flushParagraph();
      blocks.push(...bulletBlocks(bulletMatch[1].trim()));
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      paragraphBuffer.push(line);
    }
  }
  flushParagraph();

  return blocks;
}
