import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { loadCollection } from "@/lib/public-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadCollection(slug);
  if (!result) return { title: "Collection" };
  return { title: result.collection.name, description: result.collection.intro || undefined, alternates: { canonical: `/c/${slug}` } };
}

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<main className="px-4 py-8 md:px-8">Loading this collection.</main>}>
      <CollectionBody params={params} />
    </Suspense>
  );
}

async function CollectionBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await loadCollection(slug);
  if (!result) notFound();
  return (
    <main className="px-4 py-8 md:px-8">
      <Link href="/shop" className="inline-flex min-h-12 items-center text-ink-soft no-underline">
        Back to the shop
      </Link>
      <header className="mt-2 border-b border-line pb-6">
        <h1 className="text-4xl text-ink md:text-5xl">{result.collection.name}</h1>
        {result.collection.intro ? <p className="measure mt-3 text-ink-soft">{result.collection.intro}</p> : null}
      </header>
      {result.products.length ? (
        <div className="hang mt-8">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} href={`/p/${product.slug}`} />
          ))}
        </div>
      ) : (
        <div className="mt-8 border-t border-line py-10">
          <p className="text-ink-soft">Nothing in this collection is on the site yet.</p>
          <Link href="/shop" className="btn btn-secondary mt-6">
            Back to the shop
          </Link>
        </div>
      )}
    </main>
  );
}
