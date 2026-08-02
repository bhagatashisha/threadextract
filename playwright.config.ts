import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Loads .env.test (+ .env.test.local if present) into process.env, the same
// way Next.js itself would for NODE_ENV=test — mutates process.env directly,
// so both the webServer child process (spawned below, inherits this env)
// and this config/spec files themselves (which import "@/lib/db" etc. via
// relative paths) see a consistent, isolated test database and secrets.
// .env.local is deliberately NOT loaded in this mode (Next.js's own rule),
// so e2e runs never touch a developer's real local secrets.
// @types/node types NODE_ENV as read-only; this is the standard workaround.
(process.env as { NODE_ENV: string }).NODE_ENV = "test";
loadEnvConfig(process.cwd());

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // tests share one Postgres database; avoid cross-test row collisions
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
