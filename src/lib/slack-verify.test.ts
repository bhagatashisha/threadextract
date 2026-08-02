import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { verifySlackRequest } from "./slack-verify";

const SECRET = "test-signing-secret";

function sign(timestamp: string, body: string): string {
  return "v0=" + crypto.createHmac("sha256", SECRET).update(`v0:${timestamp}:${body}`, "utf8").digest("hex");
}

function makeRequest(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/slack/events", { method: "POST", headers });
}

describe("verifySlackRequest", () => {
  beforeEach(() => {
    process.env.SLACK_SIGNING_SECRET = SECRET;
  });

  it("accepts a validly signed request with a fresh timestamp", () => {
    const body = JSON.stringify({ type: "event_callback" });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const req = makeRequest({
      "x-slack-signature": sign(timestamp, body),
      "x-slack-request-timestamp": timestamp,
    });
    expect(verifySlackRequest(req, body)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ type: "event_callback" });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const req = makeRequest({
      "x-slack-signature": sign(timestamp, body),
      "x-slack-request-timestamp": timestamp,
    });
    expect(verifySlackRequest(req, body + "tampered")).toBe(false);
  });

  it("rejects a wrong signature", () => {
    const body = JSON.stringify({ type: "event_callback" });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const req = makeRequest({
      "x-slack-signature": "v0=" + "0".repeat(64),
      "x-slack-request-timestamp": timestamp,
    });
    expect(verifySlackRequest(req, body)).toBe(false);
  });

  it("rejects a timestamp older than the replay window", () => {
    const body = JSON.stringify({ type: "event_callback" });
    const timestamp = String(Math.floor(Date.now() / 1000) - 60 * 10);
    const req = makeRequest({
      "x-slack-signature": sign(timestamp, body),
      "x-slack-request-timestamp": timestamp,
    });
    expect(verifySlackRequest(req, body)).toBe(false);
  });

  it("rejects a request missing the signature header", () => {
    const body = JSON.stringify({ type: "event_callback" });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const req = makeRequest({ "x-slack-request-timestamp": timestamp });
    expect(verifySlackRequest(req, body)).toBe(false);
  });

  it("rejects a request missing the timestamp header", () => {
    const body = JSON.stringify({ type: "event_callback" });
    const req = makeRequest({ "x-slack-signature": sign("123", body) });
    expect(verifySlackRequest(req, body)).toBe(false);
  });

  it("rejects when the signing secret is not configured", () => {
    delete process.env.SLACK_SIGNING_SECRET;
    const body = JSON.stringify({ type: "event_callback" });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const req = makeRequest({
      "x-slack-signature": sign(timestamp, body),
      "x-slack-request-timestamp": timestamp,
    });
    expect(verifySlackRequest(req, body)).toBe(false);
  });
});
