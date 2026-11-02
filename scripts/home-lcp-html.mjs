import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { optimizeHomeHtml } from "../lib/home-html.mjs";

async function htmlFiles(dir, found = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await htmlFiles(full, found);
    else if (entry.name.endsWith(".html")) found.push(full);
  }
  return found;
}

const files = await htmlFiles(".next/server");
let changed = 0;
for (const file of files) {
  const html = await readFile(file, "utf8");
  const next = optimizeHomeHtml(html);
  if (next === html) continue;
  await writeFile(file, next);
  changed += 1;
}
console.log(`home-lcp-html: updated ${changed} homepage file(s).`);
