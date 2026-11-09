import { legiblePigment } from "./pigment-math";

/** The Pour Room grounds — keep in step with the html:has(.pour-room) tokens in globals.css. */
export const GESSO = "#ecede8";
export const INK = "#18222c";
export const GESSO_NIGHT = "#14191f";
export const COBALT = "#2a44c4";

const HEX = /^#[0-9a-f]{6}$/i;

export type Pour = { pour: string; ink: string; text: string; textNight: string };

/** A sampled pigment plus the two text variants that stay AA on the light and dark walls. */
export function pourOf(pigment?: string | null, ink?: string | null): Pour {
  const hex = pigment && HEX.test(pigment) ? pigment.toLowerCase() : COBALT;
  return {
    pour: hex,
    ink: ink && HEX.test(ink) ? ink.toLowerCase() : "#ffffff",
    text: legiblePigment(hex, GESSO, INK),
    textNight: legiblePigment(hex, GESSO_NIGHT, GESSO),
  };
}

/** data-* attributes PourMotion reads to tint the page as a section scrolls past. */
export function pourData(pour: Pour) {
  return {
    "data-pour": pour.pour,
    "data-pour-ink": pour.ink,
    "data-pour-text": pour.text,
    "data-pour-text-night": pour.textNight,
  };
}

/** The same values as CSS custom properties, for server-rendered first paint. */
export function pourCss(pour: Pour) {
  return `--pour:${pour.pour};--pour-ink:${pour.ink};--pour-text:${pour.text};--pour-text-night:${pour.textNight};`;
}

/** Tint the whole page with a pour (client only). */
export function paintPour(pour: Pour) {
  const style = document.documentElement.style;
  style.setProperty("--pour", pour.pour);
  style.setProperty("--pour-ink", pour.ink);
  style.setProperty("--pour-text", pour.text);
  style.setProperty("--pour-text-night", pour.textNight);
}

/** Read a pour back out of the data-* attributes written by pourData. */
export function pourFromDataset(data: DOMStringMap): Pour | null {
  const { pour, pourInk, pourText, pourTextNight } = data;
  if (!pour || !HEX.test(pour)) return null;
  const ok = (value?: string) => (value && HEX.test(value) ? value : null);
  return {
    pour,
    ink: ok(pourInk) ?? "#ffffff",
    text: ok(pourText) ?? pour,
    textNight: ok(pourTextNight) ?? pour,
  };
}
