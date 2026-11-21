import { defineConfig, devices } from "@playwright/test";
import { applyFixtureEnv } from "./e2e/fixture-env";

// Never read .env.local here — it points at production. The fixture supplies
// an isolated database and @example.test accounts; it throws before the suite
// starts if the database host is unsafe.
applyFixtureEnv();

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3210" },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3210",
    url: "http://127.0.0.1:3210",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
