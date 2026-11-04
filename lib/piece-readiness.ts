export type PieceReadiness = {
  isReady: boolean;
  score: number; // 0 to 100
  label: string;
  badges: { label: string; tone: "ok" | "warn" | "neutral" }[];
  missing: string[];
};

type PieceInput = {
  title?: string | null;
  categoryId?: string | null;
  attributes?: Record<string, unknown> | null;
  priceMinor?: number | null;
  status?: string | null;
  hasPhoto: boolean;
};

export function evaluatePieceReadiness(piece: PieceInput): PieceReadiness {
  const missing: string[] = [];
  const badges: { label: string; tone: "ok" | "warn" | "neutral" }[] = [];
  let score = 0;

  // 1. Photo (Critical)
  if (piece.hasPhoto) {
    score += 40;
  } else {
    missing.push("Photo");
    badges.push({ label: "No photo", tone: "warn" });
  }

  // 2. Title (Critical)
  if (piece.title && piece.title.trim().length > 0) {
    score += 25;
  } else {
    missing.push("Title");
    badges.push({ label: "No title", tone: "warn" });
  }

  // 3. Category / Group
  if (piece.categoryId) {
    score += 15;
  } else {
    missing.push("Group");
    badges.push({ label: "No group", tone: "neutral" });
  }

  // 4. Dimensions / Size
  const attrs = piece.attributes ?? {};
  const hasSize = typeof attrs.size === "string" && attrs.size.trim().length > 0;
  if (hasSize) {
    score += 10;
  } else {
    missing.push("Dimensions");
    badges.push({ label: "No size", tone: "neutral" });
  }

  // 5. Price
  if (typeof piece.priceMinor === "number" && piece.priceMinor > 0) {
    score += 10;
    badges.push({ label: "Priced", tone: "ok" });
  } else {
    badges.push({ label: "Inquire price", tone: "neutral" });
  }

  const isReady = piece.hasPhoto && Boolean(piece.title && piece.title.trim().length > 0);

  let label = "Draft";
  if (score === 100) {
    label = "Complete";
  } else if (isReady) {
    label = "Ready to publish";
  } else {
    label = `Needs ${missing.join(", ")}`;
  }

  return {
    isReady,
    score,
    label,
    badges,
    missing,
  };
}

