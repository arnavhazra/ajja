export function slugify(input: string) {
  const slug = input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "piece";
}

export function pieceSlug(seed: string) {
  return `piece-${seed.replace(/[^a-z0-9]/gi, "").slice(0, 10).toLowerCase()}`;
}
