import "server-only";

import { headers } from "next/headers";

export async function deskPrefix() {
  const headerList = await headers();
  // Only the proxy's rewrite can mark a request as desk traffic; the prefix
  // itself always comes from server env, never from a client-set header.
  if (headerList.get("x-ajja-desk") !== "1") return "";
  const adminPath = process.env.ADMIN_PATH?.replace(/^\/+|\/+$/g, "");
  return adminPath ? `/${adminPath}` : "";
}
