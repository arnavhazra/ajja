import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/contrast";

const pairs = [
  ["ink on linen", "#1E1B18", "#F7F4EE", 7],
  ["umber on linen", "#6B6258", "#F7F4EE", 4.5],
  ["linen on terracotta dark", "#F7F4EE", "#A3442D", 4.5],
  ["moss on linen", "#3E5C47", "#F7F4EE", 4.5],
  ["ink on bone", "#1E1B18", "#EFEAE1", 7],
  ["umber on bone", "#6B6258", "#EFEAE1", 4.5],
];

describe("contrast", () => {
  it("keeps text pairs readable", () => {
    for (const [name, foreground, background, minimum] of pairs) {
      expect(contrastRatio(String(foreground), String(background)), String(name)).toBeGreaterThanOrEqual(Number(minimum));
    }
  });
});
