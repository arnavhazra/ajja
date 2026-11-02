import { describe, expect, it } from "vitest";
import { dollarsToMinor, formatMoney, minorToDollars } from "@/lib/money";

describe("money", () => {
  it("stores dollars as cents", () => {
    expect(dollarsToMinor("40")).toBe(4000);
    expect(dollarsToMinor("$40.50")).toBe(4050);
    expect(dollarsToMinor("")).toBeNull();
    expect(minorToDollars(4050)).toBe("40.50");
  });

  it("formats US dollars", () => {
    expect(formatMoney(4000)).toBe("$40.00");
    expect(formatMoney(null)).toBeNull();
  });

  it("rejects a price that is not a number", () => {
    expect(() => dollarsToMinor("forty")).toThrow(/price/i);
  });
});
