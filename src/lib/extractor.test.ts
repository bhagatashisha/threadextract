import { describe, it, expect } from "vitest";
import { isValidAiExtractionResult } from "./extractor";

describe("isValidAiExtractionResult", () => {
  it("accepts a valid result", () => {
    expect(isValidAiExtractionResult({ title: "Fixed the bug", markdown_content: "### The Problem\nX" })).toBe(true);
  });

  it("rejects a missing title", () => {
    expect(isValidAiExtractionResult({ markdown_content: "content" })).toBe(false);
  });

  it("rejects an empty-string title", () => {
    expect(isValidAiExtractionResult({ title: "   ", markdown_content: "content" })).toBe(false);
  });

  it("rejects a non-string markdown_content", () => {
    expect(isValidAiExtractionResult({ title: "Title", markdown_content: 123 })).toBe(false);
  });

  it("accepts extra unexpected keys alongside valid fields", () => {
    expect(
      isValidAiExtractionResult({ title: "Title", markdown_content: "content", extra: "field" }),
    ).toBe(true);
  });

  it("rejects null, undefined, and non-object input", () => {
    expect(isValidAiExtractionResult(null)).toBe(false);
    expect(isValidAiExtractionResult(undefined)).toBe(false);
    expect(isValidAiExtractionResult("a string")).toBe(false);
    expect(isValidAiExtractionResult(42)).toBe(false);
  });
});
