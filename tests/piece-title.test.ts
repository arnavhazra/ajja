import { describe, expect, it } from "vitest";
import { hasRealTitle, pieceTitle } from "@/lib/piece-title";

describe("pieceTitle fallback", () => {
  it("keeps a real name", () => {
    expect(pieceTitle("Green Pour", "paintings", {}, "id-1")).toBe("Green Pour");
  });

  it("names unnamed pieces uniquely by kind and id", () => {
    const a = pieceTitle("", "paintings", {}, "abc12345-xxxx");
    const b = pieceTitle("", "paintings", {}, "def67890-xxxx");
    const c = pieceTitle("", "woodwork", {}, "abc12345-xxxx");
    expect(a).toBe("Poured painting · No. abc123");
    expect(b).toBe("Poured painting · No. def678");
    expect(c).toBe("Handmade woodwork · No. abc123");
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it("treats placeholder names as unnamed", () => {
    expect(hasRealTitle("Title not written yet")).toBe(false);
    expect(hasRealTitle("Studio Study 12")).toBe(false);
    expect(hasRealTitle("")).toBe(false);
    expect(hasRealTitle("Walnut bowl")).toBe(true);
  });

  it("uses the slug tail when no id is given", () => {
    expect(pieceTitle("", null, {}, "piece-abc123xyz")).toBe("Studio piece · No. abc123");
  });
});
