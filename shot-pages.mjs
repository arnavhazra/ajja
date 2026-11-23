import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3211", { waitUntil: "networkidle" });
const catHref = await page.locator('.idx-row').first().getAttribute("href");
console.log("category:", catHref);
if (catHref) {
  await page.goto(`http://localhost:3211${catHref}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "/home/ubuntu/shot-category.png" });
  const pieceHref = await page.locator('a[href^="/p/"]').first().getAttribute("href");
  console.log("piece:", pieceHref);
  if (pieceHref) {
    await page.goto(`http://localhost:3211${pieceHref}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "/home/ubuntu/shot-piece.png" });
  }
}
await page.close();
await browser.close();
