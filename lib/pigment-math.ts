type Rgb = { r: number; g: number; b: number };
type Lab = { l: number; a: number; b: number };

function hexToRgb(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function srgbToLinear(v: number) {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function hexToLab(hex: string): Lab | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  // D65/2° XYZ
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/** CIE76 ΔE in Lab space. Below ~6 is near-identical to the eye. */
export function deltaE(a: string, b: string): number {
  const la = hexToLab(a);
  const lb = hexToLab(b);
  if (!la || !lb) return Number.POSITIVE_INFINITY;
  return Math.hypot(la.l - lb.l, la.a - lb.a, la.b - lb.b);
}

/** Drop entries whose pigment is within threshold ΔE of an already-kept one. */
export function dedupeByPigment<T>(items: T[], hex: (item: T) => string, threshold = 6): T[] {
  const kept: { item: T; lab: Lab }[] = [];
  for (const item of items) {
    const lab = hexToLab(hex(item));
    if (!lab) continue;
    const near = kept.some((entry) => Math.hypot(entry.lab.l - lab.l, entry.lab.a - lab.a, entry.lab.b - lab.b) < threshold);
    if (!near) kept.push({ item, lab });
  }
  return kept.map((entry) => entry.item);
}

/** Sort swatches by hue, then lightness, so the index reads as a spectrum. */
export function sortByHue<T>(items: T[], hex: (item: T) => string): T[] {
  const key = (item: T) => {
    const rgb = hexToRgb(hex(item));
    if (!rgb) return { h: 0, l: 0, s: 0 };
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let h = 0;
    if (d > 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return { h, l, s };
  };
  return [...items].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    // Push near-neutral greys/browns to the end so they do not dominate the run.
    const aNeutral = ka.s < 0.08;
    const bNeutral = kb.s < 0.08;
    if (aNeutral !== bNeutral) return aNeutral ? 1 : -1;
    if (aNeutral && bNeutral) return kb.l - ka.l;
    return ka.h - kb.h || kb.s - ka.s || ka.l - kb.l;
  });
}
