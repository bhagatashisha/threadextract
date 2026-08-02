import { describe, it, expect } from "vitest";
import type { BlockObjectRequest } from "@notionhq/client";
import { markdownToNotionBlocks, chunkText } from "./notion";

function richTextContent(item: unknown): string {
  if (item && typeof item === "object" && "text" in item) {
    const text = (item as { text?: { content?: string } }).text;
    return text?.content ?? "";
  }
  return "";
}

function textOf(block: BlockObjectRequest): string {
  if ("paragraph" in block && block.paragraph) return richTextContent(block.paragraph.rich_text[0]);
  if ("heading_3" in block && block.heading_3) return richTextContent(block.heading_3.rich_text[0]);
  if ("bulleted_list_item" in block && block.bulleted_list_item)
    return richTextContent(block.bulleted_list_item.rich_text[0]);
  return "";
}

describe("markdownToNotionBlocks", () => {
  it("converts a heading line to a heading_3 block", () => {
    const blocks = markdownToNotionBlocks("### The Problem");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("heading_3");
    expect(textOf(blocks[0])).toBe("The Problem");
  });

  it("converts bullet lines to bulleted_list_item blocks, one per line, in order", () => {
    const blocks = markdownToNotionBlocks("- first\n- second\n* third");
    expect(blocks.map((b) => b.type)).toEqual(["bulleted_list_item", "bulleted_list_item", "bulleted_list_item"]);
    expect(blocks.map(textOf)).toEqual(["first", "second", "third"]);
  });

  it("converts plain multi-line paragraphs separated by blank lines", () => {
    const blocks = markdownToNotionBlocks("line one\nline two\n\nline three");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("paragraph");
    expect(textOf(blocks[0])).toBe("line one\nline two");
    expect(textOf(blocks[1])).toBe("line three");
  });

  it("handles mixed heading + paragraph + bullets + paragraph in order", () => {
    const markdown = ["### The Problem", "Something broke.", "", "### The Solution", "- restart the service", "- check the logs", "", "All good now."].join("\n");
    const blocks = markdownToNotionBlocks(markdown);
    expect(blocks.map((b) => b.type)).toEqual([
      "heading_3",
      "paragraph",
      "heading_3",
      "bulleted_list_item",
      "bulleted_list_item",
      "paragraph",
    ]);
    expect(textOf(blocks[0])).toBe("The Problem");
    expect(textOf(blocks[1])).toBe("Something broke.");
    expect(textOf(blocks[2])).toBe("The Solution");
    expect(textOf(blocks[5])).toBe("All good now.");
  });

  it("does not emit an orphan paragraph after a heading with no body", () => {
    const blocks = markdownToNotionBlocks("### The Problem\n### The Solution");
    expect(blocks).toHaveLength(2);
    expect(blocks.every((b) => b.type === "heading_3")).toBe(true);
  });

  it("returns an empty array for empty input", () => {
    expect(markdownToNotionBlocks("")).toEqual([]);
  });

  it("returns an empty array for whitespace-only input", () => {
    expect(markdownToNotionBlocks("   \n\n   \n")).toEqual([]);
  });
});

describe("chunkText", () => {
  it("returns the original text unchanged when under the limit", () => {
    expect(chunkText("short text", 100)).toEqual(["short text"]);
  });

  it("splits long text into multiple chunks at whitespace boundaries", () => {
    const word = "abcde ";
    const longText = word.repeat(500).trim(); // well over the default limit
    const chunks = chunkText(longText);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(1900);
    }
    expect(chunks.join(" ")).toBe(longText);
  });

  it("hard-cuts when there is no whitespace to split on", () => {
    const longText = "a".repeat(50);
    const chunks = chunkText(longText, 20);
    expect(chunks.every((c) => c.length <= 20)).toBe(true);
    expect(chunks.join("")).toBe(longText);
  });
});
