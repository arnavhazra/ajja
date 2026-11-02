import Link from "next/link";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { getSettings } from "@/lib/public-data";

export async function NotFoundView() {
  const settings = await getSettings();
  return (
    <>
      <SiteHeader settings={settings} />
      <main id="content" className="flex-1 px-4 py-16 md:px-8">
        <h1 className="text-4xl text-ink md:text-5xl">That page is not here</h1>
        <p className="measure mt-4 text-ink-soft">The piece may have moved, or the address may be wrong.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/shop">
            Back to the shop
          </Link>
          <Link className="btn btn-secondary" href="/search">
            Search
          </Link>
        </div>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
