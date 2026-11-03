export function pieceTitle(title?: string | null, categoryOrHint?: string | null, attributes?: Record<string, string>) {
  const trimmed = title?.trim();
  if (trimmed && !/^title not written yet$/i.test(trimmed) && !/^studio study/i.test(trimmed)) return trimmed;
  const medium = attributes?.medium?.toLowerCase() ?? "";
  const hint = (categoryOrHint ?? "").toLowerCase();
  if (hint.includes("paint") || medium.includes("paint") || medium.includes("canvas")) return "Poured painting";
  if (hint.includes("wood") || medium.includes("wood") || medium.includes("pine")) return "Handmade woodwork";
  return "Studio piece";
}

export function pieceKind(categoryName: string | null, attributes?: Record<string, string>) {
  return attributes?.medium || categoryName || null;
}
