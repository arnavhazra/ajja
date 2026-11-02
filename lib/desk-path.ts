import "server-only";

import { headers } from "next/headers";

export async function deskPrefix() {
  const headerList = await headers();
  return headerList.get("x-ajja-prefix") ?? "";
}
