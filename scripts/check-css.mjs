// Stylesheet gate: fetch a live page, pull every linked stylesheet, and assert
// the new design shipped. Fails loudly on stale CSS.
// Usage: node scripts/check-css.mjs <page-url> --require=TOKEN [--require=...] [--absent=TOKEN]
import { mkdirSync, writeFileSync } from "node:fs";

const [pageUrl, ...flags] = process.argv.slice(2);
if (!pageUrl) {
  console.error("usage: node scripts/check-css.mjs <page-url> --require=TOKEN [--absent=TOKEN]");
  process.exit(1);
}
const required = flags.filter((f) => f.startsWith("--require=")).map((f) => f.slice(10));
const absent = flags.filter((f) => f.startsWith("--absent=")).map((f) => f.slice(9));

const base = new URL(pageUrl);
const res = await fetch(pageUrl, { redirect: "follow", cache: "no-store" });
if (!res.ok) {
  console.error(`FAIL page ${res.status}`);
  process.exit(1);
}
const html = await res.text();
const hrefs = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => new URL(m[1], base).href);
if (!hrefs.length) {
  console.error("FAIL no stylesheets linked");
  process.exit(1);
}

let css = "";
for (const href of hrefs) css += await (await fetch(href, { cache: "no-store" })).text();
mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/live.css", css);
console.log(`fetched ${hrefs.length} stylesheet(s), ${css.length} bytes -> artifacts/live.css`);

const missing = required.filter((t) => !css.includes(t));
const leaked = absent.filter((t) => css.includes(t));
for (const t of missing) console.log(`MISSING required token: ${t}`);
for (const t of leaked) console.log(`LEAKED banned token: ${t}`);
if (missing.length || leaked.length) {
  console.error("FAIL");
  process.exit(1);
}
console.log("PASS");
