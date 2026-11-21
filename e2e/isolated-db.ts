/**
 * Browser specs insert and delete fixture rows. They must never run against a
 * shared or production database. Isolation is confirmed only by an explicit
 * opt-in — E2E_ISOLATED=1 — or a localhost DATABASE_URL. A name heuristic is
 * not enough: hosted dev and production databases routinely share a name.
 */
export function e2eDbIsolated(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) return false;
  if (process.env.E2E_ISOLATED === "1") return true;
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}
