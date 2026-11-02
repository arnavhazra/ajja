import Link from "next/link";
import { Suspense } from "react";
import { Filters } from "@/components/filters";
import { ProductCard } from "@/components/product-card";
import { EventBeacon } from "@/components/event-beacon";
import { loadCategories, loadShop } from "@/lib/public-data";
import { parseShopQuery } from "@/lib/shop-query";

export default function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="px-4 py-8 md:px-8">Loading the shop…</p>}>
      <ShopResults searchParams={searchParams} />
    </Suspense>
  );
}

async function ShopResults({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseShopQuery(await searchParams);
  const [products, categories] = await Promise.all([loadShop(query), loadCategories()]);
  return (
    <main className="grid gap-8 px-4 py-8 md:px-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-4xl text-ink md:text-5xl">Shop</h1>
        <p className="measure mt-3 text-ink-soft">Original paintings and woodworking available directly from the Collegeville studio.</p>
      </header>
      <Filters query={query} categories={categories} />
      {query.q ? <EventBeacon type={products.length ? "search" : "search-empty"} term={query.q} /> : null}
      {products.length ? (
        <div className="hang">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} href={`/p/${product.slug}`} />
          ))}
        </div>
      ) : (
        <div className="border-t border-line py-10">
          <p className="measure text-ink-soft">
            Nothing is listed for sale yet. The pieces are in the studio until a name and a price are written in.
          </p>
          <Link href="/studio" className="btn btn-secondary mt-6">
            See the studio
          </Link>
        </div>
      )}
    </main>
  );
}
