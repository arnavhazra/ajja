import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";

const text = readFileSync(".env.local", "utf8");
for (const line of text.split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const split = line.indexOf("=");
  if (split < 1) continue;
  const key = line.slice(0, split).trim();
  let value = line.slice(split + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  if (!process.env[key]) process.env[key] = value;
}

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3000" },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
