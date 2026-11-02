import Link from "next/link";
import { SavedProvider } from "./saved-context";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { getSettings } from "@/lib/public-data";

export function MissingFolio() {
  return (
    <main className="px-4 py-16 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-terracotta">
          Archive · missing folio
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink md:text-5xl">That page is not here</h1>
        <p className="mt-4 max-w-prose text-umber">The piece may have moved, or the address may be wrong.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/">
            Back to the archive
          </Link>
          <Link className="btn btn-secondary" href="/#inquiry-section">
            Write to the studio
          </Link>
        </div>
      </div>
    </main>
  );
}

export async function NotFoundView() {
  const settings = await getSettings();
  return (
    <SavedProvider>
      <SiteHeader settings={settings} />
      <div id="content" className="flex-1">
        <MissingFolio />
      </div>
      <SiteFooter settings={settings} />
    </SavedProvider>
  );
}
