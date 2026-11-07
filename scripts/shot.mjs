// Screenshot a URL at 1440 and 390 for design review.
// Usage: node scripts/shot.mjs <url> <name> [dir] [--full]
// Writes <dir>/<name>-1440.png and <dir>/<name>-390.png (default dir: screenshots).
import { chromium } from "@playwright/test";

const [url, name, dir = "screenshots"] = process.argv.slice(2);
const full = process.argv.includes("--full");
if (!url || !name) {
  console.error("usage: node scripts/shot.mjs <url> <name> [dir] [--full]");
  process.exit(1);
}

const browser = await chromium.launch();
for (const [label, viewport] of [
  ["1440", { width: 1440, height: 900 }],
  ["390", { width: 390, height: 844 }],
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => {});
  // Scroll through the page so lazy images load, then settle back at top.
  // A client-side nav can destroy the evaluate context — that's fine, keep going.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/${name}-${label}.png`, fullPage: full });
  await page.close();
  console.log(`${dir}/${name}-${label}.png`);
}
await browser.close();
