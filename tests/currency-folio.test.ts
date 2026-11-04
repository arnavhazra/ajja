import { describe, expect, it } from "vitest";

describe("Currency formatting & calculations", () => {
  const RATES: Record<string, number> = {
    USD: 1.0,
    INR: 86.5,
    EUR: 0.92,
    GBP: 0.79,
  };

  function convertMinor(minor: number, currency: string) {
    const rate = RATES[currency] ?? 1.0;
    return Math.round(minor * rate);
  }

  it("converts USD price correctly to other currencies", () => {
    const priceUsdMinor = 125000; // $1,250.00
    expect(convertMinor(priceUsdMinor, "USD")).toBe(125000);
    expect(convertMinor(priceUsdMinor, "INR")).toBe(10812500); // ₹108,125
    expect(convertMinor(priceUsdMinor, "EUR")).toBe(115000); // €1,150
    expect(convertMinor(priceUsdMinor, "GBP")).toBe(98750); // £987.50
  });
});

describe("Collector's Folio Inquiry generator", () => {
  it("formats multi-piece shortlist inquiries correctly", () => {
    const items = [
      { title: "Pour No. 12", priceMinor: 85000, slug: "pour-12" },
      { title: "Carved Teak Vessel", priceMinor: 120000, slug: "teak-vessel" },
    ];

    const pieceList = items
      .map((it) => `• ${it.title} ($${(it.priceMinor / 100).toFixed(0)}) — /p/${it.slug}`)
      .join("\n");

    expect(pieceList).toContain("• Pour No. 12 ($850) — /p/pour-12");
    expect(pieceList).toContain("• Carved Teak Vessel ($1200) — /p/teak-vessel");

    const totalMinor = items.reduce((sum, item) => sum + item.priceMinor, 0);
    expect(totalMinor).toBe(205000); // $2,050.00
  });
});

describe("Room scale parser", () => {
  function parseDimensions(sizeText: string) {
    const match = sizeText.match(/(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)/);
    if (!match) return null;
    return { width: parseFloat(match[1]), height: parseFloat(match[2]) };
  }

  it("extracts width and height from dimensions text", () => {
    expect(parseDimensions("24 × 36 in")).toEqual({ width: 24, height: 36 });
    expect(parseDimensions("60 x 90 cm")).toEqual({ width: 60, height: 90 });
    expect(parseDimensions("No dimensions listed")).toBeNull();
  });
});
