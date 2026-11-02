import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/lib/csv";
import { missingFields } from "@/lib/missing";
import { pieceSlug, slugify } from "@/lib/slug";
import { parseNewYork } from "@/lib/time";

describe("catalog helpers", () => {
  it("makes a slug and a piece id", () => {
    expect(slugify("Green Pour!")).toBe("green-pour");
    expect(pieceSlug("ABC123xyz")).toBe("piece-abc123xyz");
  });

  it("round-trips a csv cell with a comma", () => {
    const rows = parseCsv(toCsv([["name", "note"], ["Ada", "hello, there"]]));
    expect(rows[1]).toEqual(["Ada", "hello, there"]);
  });

  it("lists what a draft is missing", () => {
    expect(missingFields({ title: "", priceMinor: null, categoryId: null }, [{ alt: "" }])).toEqual([
      "Name",
      "Price",
      "Group",
      "Photo description",
    ]);
  });

  it("reads a New York clock time", () => {
    const date = parseNewYork("2026-07-04T09:30");
    expect(date).not.toBeNull();
    expect(date?.toISOString()).toBe("2026-07-04T13:30:00.000Z");
  });
});
