import { describe, it, expect } from "vitest";
import { redactSecrets } from "./redact";

describe("redactSecrets", () => {
  it("redacts an AWS access key id", () => {
    expect(redactSecrets("key: AKIAABCDEFGHIJKLMNOP")).toBe("key: [REDACTED-AWS-ACCESS-KEY]");
  });

  it("redacts a Slack bot token", () => {
    // Built from parts rather than one literal so it isn't shaped like a
    // real credential for secret-scanning tools (this is a fixture, not a
    // real token, but the format alone is enough to trip some scanners).
    const fakeToken = ["xoxb", "123456789012", "abcdefghijklmnop"].join("-");
    expect(redactSecrets(`token ${fakeToken}`)).toBe("token [REDACTED-SLACK-TOKEN]");
  });

  it("redacts a GitHub personal access token", () => {
    const fakeToken = "ghp_" + "1234567890abcdefghijklmnopqrstuvwx";
    expect(redactSecrets(fakeToken)).toBe("[REDACTED-GITHUB-TOKEN]");
  });

  it("redacts a JWT", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    expect(redactSecrets(jwt)).toBe("[REDACTED-JWT]");
  });

  it("redacts an OpenAI-style key", () => {
    expect(redactSecrets("sk-abcdefghijklmnopqrstuvwxyz123456")).toBe("[REDACTED-OPENAI-KEY]");
  });

  it("redacts a Bearer token", () => {
    expect(redactSecrets("Authorization: Bearer abcdefghijklmnopqrstuvwxyz")).toBe(
      "Authorization: [REDACTED-BEARER-TOKEN]",
    );
  });

  it("redacts a private key block", () => {
    const pem = "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJ...\n-----END RSA PRIVATE KEY-----";
    expect(redactSecrets(pem)).toBe("[REDACTED-PRIVATE-KEY]");
  });

  it("redacts a card-number-shaped digit run", () => {
    expect(redactSecrets("card 4111 1111 1111 1111 expires soon")).toBe(
      "card [REDACTED-CARD-NUMBER] expires soon",
    );
  });

  it("leaves ordinary conversation untouched", () => {
    const text = "User U123: the deploy is stuck, can someone check the logs?";
    expect(redactSecrets(text)).toBe(text);
  });
});
