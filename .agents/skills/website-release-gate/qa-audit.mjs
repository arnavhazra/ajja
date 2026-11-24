// website-release-gate — multi-viewport headless audit for public routes.
// Usage: node .agents/skills/website-release-gate/qa-audit.mjs <baseURL> <route...>
// Example: node .agents/skills/website-release-gate/qa-audit.mjs http://127.0.0.1:3000 / /piece/some-slug
// Writes screenshots to .qa-screenshots/ and exits non-zero on any gate failure.

import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [, , baseURL, ...routes] = process.argv;
if (!baseURL || routes.length === 0) {
  console.error("usage: node qa-audit.mjs <baseURL> <route...>");
  process.exit(2);
}

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];
const SHOT_DIR = path.resolve(process.cwd(), ".qa-screenshots");
mkdirSync(SHOT_DIR, { recursive: true });

const failures = [];
const fail = (route, viewport, msg) => failures.push(`[${route} @ ${viewport}] ${msg}`);

async function auditRoute(context, route, vp) {
  const page = await context.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("/_next/hmr")) consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  const badResponses = [];
  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("/_next/hmr")) badResponses.push(`${res.status()} ${res.url()}`);
  });

  await page.goto(baseURL + route, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

  for (const e of consoleErrors) fail(route, vp.name, `console error: ${e}`);
  for (const r of badResponses) fail(route, vp.name, `request failed: ${r}`);

  const brokenImages = await page.$$eval("img", (imgs) =>
    imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src)
  );
  for (const src of brokenImages) fail(route, vp.name, `broken image: ${src}`);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  if (overflow) fail(route, vp.name, "horizontal overflow (scrollWidth > innerWidth)");

  // Scroll top → bottom to trigger IntersectionObserver/scroll animations.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1000);

  const stuck = await page.$$eval(
    "h1, h2, a, button, [role='button'], article, section > *, li, figure",
    (els) =>
      els
        .filter((el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return (
            r.width > 0 &&
            r.height > 0 &&
            r.top < window.innerHeight &&
            r.bottom > 0 &&
            (s.opacity === "0" || s.visibility === "hidden")
          );
        })
        .map((el) => `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 120))
  );
  for (const el of stuck.slice(0, 5))
    fail(route, vp.name, `element stuck invisible: ${el}`);

  // Generic interaction check: toggles with aria-expanded open and close.
  const toggles = await page.$$("[aria-expanded]:visible");
  for (const t of toggles.slice(0, 5)) {
    try {
      const before = await t.getAttribute("aria-expanded");
      await t.click({ timeout: 2000 });
      await page.waitForTimeout(400);
      const after = await t.getAttribute("aria-expanded");
      if (before === after)
        fail(route, vp.name, "aria-expanded toggle did not change state");
      await t.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(300);
    } catch {
      fail(route, vp.name, "aria-expanded control not clickable");
    }
  }

  const safe = route === "/" ? "index" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  await page.screenshot({
    path: path.join(SHOT_DIR, `${safe}-${vp.name}.png`),
    fullPage: true,
  });
  await page.close();
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  for (const route of routes)
    for (const vp of VIEWPORTS) await auditRoute(context, route, vp);

  // Gate 3: reduced-motion pass at mobile + desktop.
  const rmContext = await browser.newContext({ reducedMotion: "reduce" });
  for (const route of routes)
    for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
      const page = await rmContext.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(baseURL + route, { waitUntil: "load" });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      const invisible = await page.$$eval("h1, main *", (els) =>
        els.filter((el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return r.height > 0 && s.opacity === "0";
        }).length
      );
      if (invisible > 0)
        fail(route, `${vp.name}+reduced-motion`, `${invisible} element(s) invisible under reduced motion`);
      await page.close();
    }
  await rmContext.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\nRELEASE GATE FAILED — ${failures.length} issue(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`release gate passed: ${routes.length} route(s) × ${VIEWPORTS.length} viewports, screenshots in .qa-screenshots/`);
