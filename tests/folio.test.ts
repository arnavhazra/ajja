import { describe, expect, it } from "vitest";
import { enquiryPrefillMessage, folioTotals, parsePiecesParam } from "@/lib/folio";

describe("folio totals", () => {
  it("reports no priced pieces so the total row stays hidden", () => {
    const totals = folioTotals([{ priceMinor: null }, { priceMinor: null }]);
    expect(totals.pricedCount).toBe(0);
    expect(totals.totalMinor).toBe(0);
  });

  it("sums only the priced pieces", () => {
    const totals = folioTotals([{ priceMinor: 4000 }, { priceMinor: null }, { priceMinor: 1250 }]);
    expect(totals.pricedCount).toBe(2);
    expect(totals.totalMinor).toBe(5250);
  });

  it("treats zero as unpriced", () => {
    expect(folioTotals([{ priceMinor: 0 }]).pricedCount).toBe(0);
  });
});

describe("pieces query parsing", () => {
  it("reads a comma list of slugs", () => {
    expect(parsePiecesParam("green-pour,oak-bowl")).toEqual(["green-pour", "oak-bowl"]);
  });

  it("drops junk and dedupes", () => {
    expect(parsePiecesParam("green-pour, ,green-pour,../etc")).toEqual(["green-pour"]);
  });

  it("returns nothing for empty or missing input", () => {
    expect(parsePiecesParam("")).toEqual([]);
    expect(parsePiecesParam(null)).toEqual([]);
    expect(parsePiecesParam(undefined)).toEqual([]);
  });

  it("caps the list", () => {
    const many = Array.from({ length: 60 }, (_, i) => `piece-${i}`).join(",");
    expect(parsePiecesParam(many)).toHaveLength(40);
  });
});

describe("enquiry prefill", () => {
  it("lists the pieces with links and prices", () => {
    const message = enquiryPrefillMessage(
      [
        { title: "Green Pour", slug: "green-pour", priceMinor: 4000 },
        { title: "Studio piece · No. a1b2c3", slug: "piece-a1b2c3", priceMinor: null },
      ],
      (minor) => `$${(minor / 100).toFixed(2)}`,
    );
    expect(message).toContain("• Green Pour ($40.00) — /p/green-pour");
    expect(message).toContain("• Studio piece · No. a1b2c3 — /p/piece-a1b2c3");
  });
});
