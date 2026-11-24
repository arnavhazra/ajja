#!/usr/bin/env node
// Enforces bundle budgets on the production build (Phase 6 gate).
// Runs after `pnpm build` in CI. Budgets cover client JS shipped under
// `.next/static/chunks` — raw bytes, which is what the build emits; the CDN
// compresses on the wire. Budgets are ceilings for regression detection:
// tighten them toward the real baseline once recorded below.

import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MAX_TOTAL_JS_BYTES = 4 * 1024 * 1024; // all client chunks
const MAX_CHUNK_BYTES = 600 * 1024; // any single chunk
const MAX_PAGE_JS_BYTES = 900 * 1024; // first-load JS per route (manifest union)

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.name.endsWith(".js")) yield path;
  }
}

const chunksDir = ".next/static/chunks";
let total = 0;
let largest = { file: "", bytes: 0 };
let failures = [];

for (const file of walk(chunksDir)) {
  const bytes = statSync(file).size;
  total += bytes;
  if (bytes > largest.bytes) largest = { file, bytes };
  if (bytes > MAX_CHUNK_BYTES) {
    failures.push(`chunk ${file} is ${(bytes / 1024).toFixed(0)}KB (limit ${MAX_CHUNK_BYTES / 1024}KB)`);
  }
}
if (total > MAX_TOTAL_JS_BYTES) {
  failures.push(`total client JS ${(total / 1024).toFixed(0)}KB (limit ${MAX_TOTAL_JS_BYTES / 1024}KB)`);
}

// Per-route first-load JS: union of the shared build manifest + each page's
// files listed in the app-build manifest.
const sizes = new Map();
const sizeOf = (rel) => {
  if (!sizes.has(rel)) {
    try {
      sizes.set(rel, statSync(join(".next", rel)).size);
    } catch {
      sizes.set(rel, 0);
    }
  }
  return sizes.get(rel);
};

try {
  const shared = JSON.parse(readFileSync(".next/build-manifest.json", "utf8"));
  const sharedFiles = [...(shared.pages?.["/_app"] ?? []), ...(shared.rootMainFiles ?? [])];
  const appPages = JSON.parse(readFileSync(".next/app-build-manifest.json", "utf8")).pages ?? {};
  let biggestPage = { page: "", bytes: 0 };
  for (const [page, files] of Object.entries(appPages)) {
    const bytes = new Set([...sharedFiles, ...files]).reduce((sum, f) => sum + sizeOf(f), 0);
    if (bytes > biggestPage.bytes) biggestPage = { page, bytes };
    if (bytes > MAX_PAGE_JS_BYTES) {
      failures.push(`route ${page} loads ${(bytes / 1024).toFixed(0)}KB first-load JS (limit ${MAX_PAGE_JS_BYTES / 1024}KB)`);
    }
  }
  console.log(`client JS: ${(total / 1024).toFixed(0)}KB total; largest chunk ${(largest.bytes / 1024).toFixed(0)}KB; heaviest route ${biggestPage.page} ${(biggestPage.bytes / 1024).toFixed(0)}KB`);
} catch (error) {
  console.log(`client JS: ${(total / 1024).toFixed(0)}KB total; largest chunk ${(largest.bytes / 1024).toFixed(0)}KB (no route manifests: ${error.message})`);
}

if (failures.length) {
  console.error("bundle budget exceeded:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
