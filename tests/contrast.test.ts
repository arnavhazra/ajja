import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/contrast";

const pairs = [
  ["ink on paper", "#1A1714", "#E4E0D4", 7],
  ["soft ink on paper", "#4E463C", "#E4E0D4", 4.5],
  ["accent ink on accent", "#F3F0E7", "#1B4332", 4.5],
  ["caption on caption ink", "#F3F0E7", "#1A1714", 7],
  ["dark ink on dark paper", "#F3F0E7", "#1C1B18", 7],
  ["dark soft ink", "#B0A898", "#1C1B18", 4.5],
  ["dark accent ink", "#102218", "#8FD4AE", 4.5],
  ["high contrast ink", "#100E0C", "#F7F4EC", 7],
  ["high contrast soft ink", "#3A332C", "#F7F4EC", 4.5],
  ["high contrast accent ink", "#F7F4EC", "#083526", 4.5],
  ["high contrast dark", "#F7F4EC", "#090807", 7],
  ["high contrast dark soft ink", "#E8E2D6", "#090807", 4.5],
  ["high contrast dark accent ink", "#04140C", "#B6F3CF", 4.5],
  ["clay ink", "#1C1510", "#E8DFD4", 7],
  ["clay soft ink", "#554536", "#E8DFD4", 4.5],
  ["clay accent ink", "#F6F0E8", "#7A341C", 4.5],
  ["clay dark ink", "#F6F0E8", "#1C1814", 7],
  ["clay dark soft ink", "#C4B4A4", "#1C1814", 4.5],
  ["clay dark accent ink", "#2A140C", "#F0A27A", 4.5],
  ["ink theme ink", "#161614", "#E2E0D8", 7],
  ["ink theme soft ink", "#45423C", "#E2E0D8", 4.5],
  ["ink theme accent ink", "#F2F1EB", "#1A467C", 4.5],
  ["ink theme dark ink", "#F2F1EB", "#16171A", 7],
  ["ink theme dark soft ink", "#B4B0A6", "#16171A", 4.5],
  ["ink theme dark accent ink", "#101820", "#9EC1EE", 4.5],
];

describe("contrast", () => {
  it("keeps text pairs readable", () => {
    for (const [name, foreground, background, minimum] of pairs) {
      expect(contrastRatio(String(foreground), String(background)), String(name)).toBeGreaterThanOrEqual(Number(minimum));
    }
  });
});
