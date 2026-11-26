/**
 * The only attribute keys the public site may ever read. Everything else the
 * desk stores in attributes — original upload filenames, AI tidy-up model and
 * cost, enhanced-version maps, private catalogue notes — stays server-side.
 * An allowlist (not a blocklist) so any future private key is safe by default.
 */
export const PUBLIC_ATTRIBUTE_KEYS = ["size", "medium", "details", "dimensions"] as const;

export function publicAttributes(attributes: Record<string, string>): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const key of PUBLIC_ATTRIBUTE_KEYS) {
    const value = attributes[key];
    if (typeof value === "string" && value.trim()) clean[key] = value;
  }
  return clean;
}
