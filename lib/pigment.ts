import "server-only";

import sharp from "sharp";

export { deltaE, dedupeByPigment, hexToLab, sortByHue } from "./pigment-math";

export type Pigment = { hex: string; ink: "#ffffff" | "#18222c" };

const FALLBACK: Pigment = { hex: "#2a44c4", ink: "#ffffff" };

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(r: number, g: number, b: number) {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function pickPigment(pixels: Uint8Array | Buffer, channels: number): Pigment {
  let best: { score: number; r: number; g: number; b: number } | null = null;
  let muted: { score: number; r: number; g: number; b: number } | null = null;
  for (let i = 0; i + 2 < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const value = max / 255;
    const score = saturation * 0.7 + (1 - Math.abs(value - 0.62)) * 0.3;
    if (value > 0.12 && (!muted || score > muted.score)) muted = { score, r, g, b };
    if (saturation > 0.28 && value > 0.22 && (!best || score > best.score)) best = { score, r, g, b };
  }
  if (!best) best = muted;
  if (!best) return FALLBACK;
  const lum = luminance(best.r, best.g, best.b);
  const ink = (lum + 0.05) / 0.05 > 1.05 / (lum + 0.05) * 1.35 ? "#18222c" : "#ffffff";
  return { hex: toHex(best.r, best.g, best.b), ink };
}

export async function pigmentFromDataUri(dataUri: string | null): Promise<Pigment> {
  if (!dataUri?.startsWith("data:image/")) return FALLBACK;
  try {
    const base64 = dataUri.slice(dataUri.indexOf(",") + 1);
    const { data, info } = await sharp(Buffer.from(base64, "base64"))
      .resize(12, 12, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return pickPigment(data, info.channels);
  } catch {
    return FALLBACK;
  }
}
