import { describe, expect, it } from "vitest";
import { evaluatePieceReadiness } from "@/lib/piece-readiness";

describe("evaluatePieceReadiness", () => {
  it("flags incomplete draft missing photo and title", () => {
    const readiness = evaluatePieceReadiness({
      hasPhoto: false,
      title: "",
      categoryId: null,
      attributes: {},
      priceMinor: null,
    });
    expect(readiness.isReady).toBe(false);
    expect(readiness.missing).toContain("Photo");
    expect(readiness.missing).toContain("Title");
    expect(readiness.score).toBeLessThan(50);
  });

  it("marks piece with photo and title as ready to publish", () => {
    const readiness = evaluatePieceReadiness({
      hasPhoto: true,
      title: "River Bend",
      categoryId: "cat-1",
      attributes: { size: '24" x 36"' },
      priceMinor: 45000,
    });
    expect(readiness.isReady).toBe(true);
    expect(readiness.score).toBe(100);
    expect(readiness.label).toBe("Complete");
    expect(readiness.missing).toHaveLength(0);
  });

  it("permits unpriced pieces as inquiry items", () => {
    const readiness = evaluatePieceReadiness({
      hasPhoto: true,
      title: "Walnut Vessel",
      categoryId: "cat-2",
      attributes: { size: '10" dia' },
      priceMinor: null,
    });
    expect(readiness.isReady).toBe(true);
    expect(readiness.badges.some((b) => b.label === "Inquire price")).toBe(true);
  });
});

