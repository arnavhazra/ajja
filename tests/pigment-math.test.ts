import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/contrast";
import { dedupeByPigment, deltaE, legiblePigment, sortByHue } from "@/lib/pigment-math";

describe("pigment deltaE", () => {
  it("is zero for identical colours", () => {
    expect(deltaE("#a0442d", "#a0442d")).toBe(0);
  });

  it("is small for near-identical browns and large for distant hues", () => {
    expect(deltaE("#a0442d", "#a1452e")).toBeLessThan(6);
    expect(deltaE("#a0442d", "#2a44c4")).toBeGreaterThan(6);
  });
});

describe("pigment dedupe", () => {
  it("removes near-identical swatches and keeps the first", () => {
    const rows = dedupeByPigment(["#a0442d", "#a1452e", "#2a44c4", "#3e5c47"], (hex) => hex);
    expect(rows).toEqual(["#a0442d", "#2a44c4", "#3e5c47"]);
  });
});

describe("hue sort", () => {
  it("orders by hue and pushes neutrals last", () => {
    const sorted = sortByHue(["#2a44c4", "#8a8a8a", "#a0442d", "#3e5c47"], (hex) => hex);
    expect(sorted[0]).toBe("#a0442d"); // red-orange first
    expect(sorted[sorted.length - 1]).toBe("#8a8a8a"); // grey last
    expect(sorted.indexOf("#3e5c47")).toBeLessThan(sorted.indexOf("#2a44c4")); // green before blue
  });
});

describe("legible pigment", () => {
  it("keeps a pigment that already reads on the wall", () => {
    expect(legiblePigment("#2a44c4", "#ecede8", "#18222c")).toBe("#2a44c4");
  });

  it("darkens a pale pour until it reaches AA on gesso", () => {
    const text = legiblePigment("#f59e0b", "#ecede8", "#18222c");
    expect(text).not.toBe("#f59e0b");
    expect(contrastRatio(text, "#ecede8")).toBeGreaterThanOrEqual(4.5);
  });

  it("lightens a deep pour on the night wall", () => {
    const text = legiblePigment("#31430f", "#14191f", "#ecede8");
    expect(contrastRatio(text, "#14191f")).toBeGreaterThanOrEqual(4.5);
  });
});
