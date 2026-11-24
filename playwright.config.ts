import { defineConfig, devices } from "@playwright/test";
import { applyFixtureEnv } from "./e2e/fixture-env";

// Same isolated E2E guardrails as playwright.config.ts — never points at production.
applyFixtureEnv();

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3211",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3211",
    url: "http://127.0.0.1:3211",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
