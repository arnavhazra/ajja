import { Suspense } from "react";
import type { Metadata } from "next";
import { EventBeacon } from "@/components/event-beacon";
import { ProductCard } from "@/components/product-card";
import { loadShop } from "@/lib/public-data";
import { parseShopQuery } from "@/lib/shop-query";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="px-4 py-8 md:px-8">Searching…</p>}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = parseShopQuery(params);
  const products = query.q ? await loadShop(query) : [];
  return (
    <main className="px-4 py-8 md:px-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-4xl text-ink md:text-5xl">Search</h1>
        <p className="measure mt-3 text-ink-soft">Find pieces by medium, title, color, or description.</p>
      </header>
      <form action="/search" className="mt-6 grid max-w-xl gap-3">
        <label className="grid gap-1.5">
          What are you looking for?
          <input className="field" name="q" defaultValue={query.q} placeholder="e.g. walnut, green, bowl, tray" />
        </label>
        <button className="btn btn-primary w-fit" type="submit">
          Search
        </button>
      </form>
      {query.q ? <EventBeacon type={products.length ? "search" : "search-empty"} term={query.q} /> : null}
      {query.q && products.length === 0 ? <p className="mt-8 text-ink-soft">Nothing matched that search.</p> : null}
      {products.length ? (
        <div className="hang mt-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} href={`/p/${product.slug}`} />
          ))}
        </div>
      ) : null}
    </main>
  );
}
