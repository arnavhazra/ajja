import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/*
 * The site must not publish facts the family has not written.
 * This test fails if invented biography, history, or sales language
 * comes back into user-facing code.
 */

const BANNED = [
  /ramanand/i,
  /mysore/i,
  /chamundi/i,
  /nilgiri/i,
  /jackfruit/i,
  /kanna/i,
  /dammar/i,
  /horsetail/i,
  /sesame oil/i,
  /1964/,
  /\b(est\.?|b\.?|born|since|circa)\s*19\d\d/i,
  /series\s*xi/i,
  /catalogue raisonn/i,
  /specimen/i,
  /\bpatron/i,
  /custod/i,
  /studio ledger/i,
  /serial-recorded/i,
  /studio manifest/i,
  /reserve piece/i,
  /collector'?s (folio|bag)/i,
  /atelier/i,
  /eleanor vance/i,
  /collection\.art/i,
];

const ROOTS = ["app", "components", "lib"];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (/\.(ts|tsx|css)$/.test(entry)) {
      yield path;
    }
  }
}

describe("no invented copy", () => {
  const files = ROOTS.flatMap((root) => [...walk(join(process.cwd(), root))]);
  it("scans the source tree", () => {
    expect(files.length).toBeGreaterThan(50);
  });
  for (const file of files) {
    it(`has no invented facts: ${file}`, () => {
      const source = readFileSync(file, "utf8");
      for (const pattern of BANNED) {
        expect(source, `${file} contains ${pattern}`).not.toMatch(pattern);
      }
    });
  }
});
