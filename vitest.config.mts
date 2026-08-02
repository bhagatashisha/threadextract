import { defineConfig } from "vitest/config";
import path from "path";

const rootDir = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  test: {
    // Modules under test import "@/lib/db", which constructs a PrismaClient
    // that validates DATABASE_URL's shape at construction time even though
    // no test here issues a real query (Prisma calls are mocked where used).
    env: {
      DATABASE_URL: "postgresql://user:password@localhost:5432/threadextract_test",
    },
    // e2e/*.spec.ts are Playwright specs (run via `pnpm test:e2e`), not
    // Vitest ones — Vitest's default include pattern would otherwise sweep
    // them up and fail trying to run Playwright's test() API as its own.
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
});
