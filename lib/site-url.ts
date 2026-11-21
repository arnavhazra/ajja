import { brand } from "./brand";

/**
 * Canonical public base URL. In production this is always the brand domain —
 * a *.vercel.app hostname must never become the canonical. Preview deploys and
 * local dev keep their own URLs so shares and sign-in flows stay on the host
 * you are actually using.
 */
export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    const withProtocol = configured.startsWith("http") ? configured : `https://${configured}`;
    return withProtocol.replace(/\/$/, "");
  }
  if (process.env.VERCEL_ENV === "production") return brand.url;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === "production") return brand.url;
  return "http://localhost:3000";
}
