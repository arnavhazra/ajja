import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/i);

const piecesParamSchema = z.string().trim().max(2000);

/** Parse a `?pieces=slug,slug` query value into a clean list of slugs. */
export function parsePiecesParam(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const candidate = piecesParamSchema.safeParse(raw);
  if (!candidate.success) return [];
  const slugs = candidate.data
    .split(",")
    .map((part) => slugSchema.safeParse(part))
    .filter((part): part is z.ZodSafeParseSuccess<string> => part.success)
    .map((part) => part.data);
  return [...new Set(slugs)].slice(0, 40);
}

export interface FolioLine {
  priceMinor: number | null;
}

/** Totals for the saved-pieces drawer. When nothing is priced the row stays hidden. */
export function folioTotals(items: FolioLine[]) {
  const priced = items.filter((item) => item.priceMinor != null && item.priceMinor > 0);
  return {
    pricedCount: priced.length,
    totalMinor: priced.reduce((sum, item) => sum + (item.priceMinor ?? 0), 0),
  };
}

export interface PrefillPiece {
  title: string;
  slug: string;
  priceMinor: number | null;
}

/** The note the enquiry form starts with when arriving from the saved list. */
export function enquiryPrefillMessage(pieces: PrefillPiece[], format: (minor: number) => string | null): string {
  const list = pieces
    .map((piece) => {
      const price = piece.priceMinor != null ? format(piece.priceMinor) : null;
      return `• ${piece.title}${price ? ` (${price})` : ""} — /p/${piece.slug}`;
    })
    .join("\n");
  return `Hello,\n\nI would like to ask about these pieces:\n\n${list}\n\nPlease let me know if they are still available, and about delivery or collection.`;
}
