import Link from "next/link";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { brand } from "@/lib/brand";
import { getSettings } from "@/lib/public-data";

export function MissingPage() {
  return (
    <main className="shell grid min-h-[70svh] content-center py-24">
      <p className="display text-[clamp(6rem,22vw,20rem)] leading-[0.8] text-pigment">404</p>
      <h1 className="display-wide mt-8 text-4xl md:text-5xl">That page is not here.</h1>
      <p className="prose mt-4 max-w-prose text-tar-soft">The piece may have moved, or the address may be wrong.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="btn btn-primary" href="/category/all">
          See all pieces
        </Link>
        <Link className="btn btn-secondary" href="/#inquire">
          Ask the studio
        </Link>
      </div>
    </main>
  );
}

export async function NotFoundView() {
  const settings = await getSettings();
  return (
    <>
      <SiteHeader name={brand.name} hasStory={Boolean(settings.story.trim())} />
      <div id="content" className="flex-1">
        <MissingPage />
      </div>
      <SiteFooter settings={settings} hasStory={Boolean(settings.story.trim())} />
    </>
  );
}
