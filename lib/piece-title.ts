export function hasRealTitle(title?: string | null) {
  const trimmed = title?.trim();
  return Boolean(trimmed && !/^title not written yet$/i.test(trimmed) && !/^studio study/i.test(trimmed));
}

function shortRef(ref?: string | null) {
  const clean = (ref ?? "").replace(/^piece-/i, "").replace(/[^a-z0-9]/gi, "");
  return clean.slice(0, 6).toLowerCase() || "000000";
}

/** The six-character inventory number shown in typed captions ("no. f8930a"). */
export function pieceRef(ref?: string | null) {
  return shortRef(ref);
}

export function pieceTitle(
  title?: string | null,
  categoryOrHint?: string | null,
  attributes?: Record<string, string>,
  ref?: string | null,
) {
  const trimmed = title?.trim();
  if (trimmed && hasRealTitle(trimmed)) return trimmed;
  const medium = attributes?.medium?.toLowerCase() ?? "";
  const hint = (categoryOrHint ?? "").toLowerCase();
  let kind = "Studio piece";
  if (hint.includes("paint") || medium.includes("paint") || medium.includes("canvas")) kind = "Poured painting";
  else if (hint.includes("wood") || medium.includes("wood") || medium.includes("pine")) kind = "Handmade woodwork";
  return `${kind} · No. ${shortRef(ref)}`;
}

export function pieceKind(categoryName: string | null, attributes?: Record<string, string>) {
  return attributes?.medium || categoryName || null;
}
