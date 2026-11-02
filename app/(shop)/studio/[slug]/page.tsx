import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { ContactActions } from "@/components/contact-actions";
import { Gallery } from "@/components/gallery";
import { pieceTitle } from "@/components/product-card";
import { getSettings, loadStudioPiece } from "@/lib/public-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadStudioPiece(slug);
  if (!product) return { title: "Studio" };
  return {
    title: pieceTitle(product.title, product.slug),
    description: "Studio study and archival photography from the workshop in Collegeville, Pennsylvania.",
    alternates: { canonical: `/studio/${product.slug}` },
  };
}

export default function StudioPiecePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<main className="px-4 py-6 md:px-8">Loading this photograph.</main>}>
      <StudioBody params={params} />
    </Suspense>
  );
}

async function StudioBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await loadStudioPiece(slug);
  if (!product) notFound();
  if (product.status === "published" || product.status === "sold") permanentRedirect(`/p/${product.slug}`);
  const settings = await getSettings();
  const title = pieceTitle(product.title, product.slug);
  return (
    <main>
      <div className="px-4 pt-4 md:px-8">
        <Link href="/studio" className="inline-flex min-h-12 items-center text-ink-soft no-underline">
          Back to the studio
        </Link>
      </div>
      <div className="mt-2 grid items-start gap-8 md:grid-cols-[minmax(0,1.45fr)_minmax(18rem,24rem)] md:gap-10">
        <Gallery images={product.images} title={title} />
        <div className="grid content-start gap-5 px-4 pb-12 md:px-0 md:pr-8">
          <div>
            <h1 className="text-4xl text-ink md:text-5xl">{title}</h1>
            <p className="nums mt-3 text-2xl text-ink">Studio Collection · Inquire</p>
          </div>
          <p className="measure border-t border-line pt-4">
            This piece is part of the working studio collection. Inquire to arrange a private viewing or ask about acquisition.
          </p>
          <ContactActions product={product} settings={settings} path={`/studio/${product.slug}`} />
        </div>
      </div>
    </main>
  );
}
