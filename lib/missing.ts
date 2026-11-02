export function missingFields(
  piece: { title: string; priceMinor: number | null; categoryId: string | null },
  images: { alt: string }[],
) {
  const missing: string[] = [];
  if (!piece.title.trim()) missing.push("Name");
  if (piece.priceMinor == null) missing.push("Price");
  if (!piece.categoryId) missing.push("Group");
  if (!images.length) missing.push("Photo");
  if (images.some((image) => !image.alt.trim())) missing.push("Photo description");
  return missing;
}
