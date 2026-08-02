import { describe, it, expect, beforeEach, vi } from "vitest";

const SECRET = "test-claim-secret";

describe("claim-token", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.CLAIM_TOKEN_SECRET = SECRET;
  });

  describe("signWorkspaceClaim / verifyWorkspaceClaim", () => {
    it("round-trips a valid token", async () => {
      const { signWorkspaceClaim, verifyWorkspaceClaim } = await import("./claim-token");
      const token = signWorkspaceClaim("workspace-123");
      expect(verifyWorkspaceClaim(token)).toEqual({ workspaceId: "workspace-123" });
    });

    it("rejects a tampered token", async () => {
      const { signWorkspaceClaim, verifyWorkspaceClaim } = await import("./claim-token");
      const token = signWorkspaceClaim("workspace-123");
      const tampered = token.slice(0, -2) + (token.slice(-2) === "AA" ? "BB" : "AA");
      expect(verifyWorkspaceClaim(tampered)).toBeNull();
    });

    it("rejects an expired token", async () => {
      const { signWorkspaceClaim, verifyWorkspaceClaim } = await import("./claim-token");
      const token = signWorkspaceClaim("workspace-123", -1);
      expect(verifyWorkspaceClaim(token)).toBeNull();
    });

    it("rejects a malformed token string without throwing", async () => {
      const { verifyWorkspaceClaim } = await import("./claim-token");
      expect(verifyWorkspaceClaim("not-a-real-token")).toBeNull();
      expect(verifyWorkspaceClaim("")).toBeNull();
    });

    it("throws at call time when CLAIM_TOKEN_SECRET is missing", async () => {
      delete process.env.CLAIM_TOKEN_SECRET;
      const { signWorkspaceClaim } = await import("./claim-token");
      expect(() => signWorkspaceClaim("workspace-123")).toThrow();
    });
  });

  describe("signOAuthState / verifyOAuthState", () => {
    it("round-trips a valid state", async () => {
      const { signOAuthState, verifyOAuthState } = await import("./claim-token");
      const state = signOAuthState();
      expect(verifyOAuthState(state)).toBe(true);
    });

    it("rejects a tampered state", async () => {
      const { signOAuthState, verifyOAuthState } = await import("./claim-token");
      const state = signOAuthState();
      const tampered = state.slice(0, -2) + (state.slice(-2) === "AA" ? "BB" : "AA");
      expect(verifyOAuthState(tampered)).toBe(false);
    });

    it("rejects an expired state", async () => {
      const { signOAuthState, verifyOAuthState } = await import("./claim-token");
      const state = signOAuthState(-1);
      expect(verifyOAuthState(state)).toBe(false);
    });

    it("rejects null/undefined/malformed input without throwing", async () => {
      const { verifyOAuthState } = await import("./claim-token");
      expect(verifyOAuthState(null)).toBe(false);
      expect(verifyOAuthState(undefined)).toBe(false);
      expect(verifyOAuthState("garbage")).toBe(false);
    });
  });
});
