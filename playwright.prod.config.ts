import { defineConfig, devices } from "@playwright/test";
import { applyFixtureEnv } from "./e2e/fixture-env";

// Production-build E2E suite against `next start`.
// Never touches production data: requires E2E_DATABASE_URL on an isolated Neon branch
// and never falls back to .env.local (applyFixtureEnv scrubs PG* and production passwords).
applyFixtureEnv();

const desktopChrome = {
  ...devices["Desktop Chrome"],
  viewport: { width: 1440, height: 900 },
};

const mobileSafari = {
  ...devices["iPhone 13"],
  viewport: { width: 390, height: 844 },
};

const specFiles = ["shop.spec.ts", "auth-security.spec.ts", "tap-targets.spec.ts", "visual-audit.spec.ts"];

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    ...desktopChrome,
    baseURL: "http://127.0.0.1:3211",
  },
  webServer: {
    command:
      "pnpm build && node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3211",
    url: "http://127.0.0.1:3211",
    reuseExistingServer: false,
    timeout: 300_000,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...desktopChrome },
      testMatch: specFiles,
    },
    {
      name: "webkit-mobile",
      use: { ...mobileSafari },
      testMatch: specFiles,
    },
    {
      name: "firefox-desktop",
      use: { ...devices["Desktop Firefox"], viewport: { width: 1440, height: 900 } },
      testMatch: specFiles,
    },
  ],
});
