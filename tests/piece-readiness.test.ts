import { describe, expect, it } from "vitest";
import { canPublishPiece } from "../lib/piece-readiness";

describe("canPublishPiece", () => {
  it("accepts a restored, named piece with a photo", () => {
    expect(canPublishPiece({ title: "Cobalt pour", deletedAt: null }, 1)).toEqual({ ok: true });
  });

  it("accepts the name Untitled and an empty price is fine", () => {
    expect(canPublishPiece({ title: "Untitled", deletedAt: null }, 3)).toEqual({ ok: true });
  });

  it("refuses a trashed piece", () => {
    const gate = canPublishPiece({ title: "Named", deletedAt: new Date() }, 2);
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toMatch(/trash/i);
  });

  it("refuses a piece with no photo", () => {
    const gate = canPublishPiece({ title: "Named", deletedAt: null }, 0);
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toMatch(/photo/i);
  });

  it.each(["", "   ", "Title not written yet", "studio study no. 4", "STUDIO STUDY"]) (
    "refuses a missing or placeholder name: %j",
    (title) => {
      const gate = canPublishPiece({ title, deletedAt: null }, 1);
      expect(gate.ok).toBe(false);
      if (!gate.ok) expect(gate.reason).toMatch(/name/i);
    },
  );
});
