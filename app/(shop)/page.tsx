import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ProductCard } from "@/components/product-card";
import { JsonLd } from "@/components/json-ld";
import { connection } from "next/server";
import { heroSrc } from "@/lib/hero-src";
import { openNow } from "@/lib/open-now";
import { getSettings, loadCollections, loadFeatured, loadNewArrivals, loadReduced, loadStudio, loadTestimonials } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import type { PublicCollection, PublicProduct } from "@/lib/types";

export default async function HomePage() {
  const [settings, studio, featured, arrivals, reduced, quotes, collections] = await Promise.all([
    getSettings(),
    loadStudio(),
    loadFeatured(),
    loadNewArrivals(),
    loadReduced(),
    loadTestimonials(),
    loadCollections(),
  ]);
  const hero = settings.heroImage || studio[0]?.images[0]?.url || "";
  const picture = await heroSrc(hero);
  const open = settings.hours.length ? (await connection(), openNow(settings.hours)) : null;
  const wall = studio.slice(0, 7);
  return (
    <main>
      {picture.src ? <link rel="preload" as="image" href={picture.src} fetchPriority="high" /> : null}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: settings.businessName,
          address: {
            "@type": "PostalAddress",
            addressLocality: settings.town,
            addressRegion: settings.region,
            addressCountry: "US",
            streetAddress: settings.address || undefined,
          },
          url: siteUrl(),
          image: hero || undefined,
          telephone: settings.phone || undefined,
        }}
      />
      <section className="hero-frame">
        {picture.src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={picture.src}
              alt="A piece from the studio."
              width={picture.width}
              height={picture.height}
              fetchPriority="high"
              decoding="async"
              loading="eager"
              className="hero-photo"
              style={{ objectPosition: `${settings.heroFocalX * 100}% ${settings.heroFocalY * 100}%` }}
            />
            <div className="hero-scrim">
              <h1 className="text-4xl md:text-5xl">{settings.heroHeadline}</h1>
              <p className="measure">{settings.heroText}</p>
              <Link className="btn btn-primary" href={studio.length ? "/studio" : "/shop"}>
                See the work
              </Link>
            </div>
          </>
        ) : (
          <div className="grid min-h-[86dvh] place-items-center px-4 py-16 text-center">
            <div className="grid justify-items-center gap-4">
              <h1 className="text-4xl text-ink md:text-5xl">{settings.heroHeadline}</h1>
              <p className="measure text-ink-soft">{settings.heroText}</p>
              <p className="text-ink-soft">Photographs will appear here.</p>
              <Link className="btn btn-primary" href={studio.length ? "/studio" : "/shop"}>
                See the work
              </Link>
            </div>
          </div>
        )}
      </section>
      {wall.length ? (
        <section className="px-4 py-12 md:px-8" aria-labelledby="studio-heading">
          <div className="border-b border-line pb-4">
            <h2 id="studio-heading" className="text-3xl text-ink">
              From the studio
            </h2>
            <p className="measure mt-2 text-ink-soft">Photographs of work. A price appears only after it is written in.</p>
          </div>
          <div className="hang mt-8">
            {wall.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <p className="mt-6">
            <Link href="/studio" className="inline-flex min-h-12 items-center text-ink no-underline">
              See the studio
            </Link>
          </p>
        </section>
      ) : null}
      {collections.length ? (
        <section className="border-t border-line px-4 py-12 md:px-8" aria-labelledby="groups-heading">
          <h2 id="groups-heading" className="text-3xl text-ink">
            Collections
          </h2>
          <div className="hang mt-8">
            {collections.map((collection) => (
              <CollectionTile key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      ) : null}
      {featured.length ? <Rail title="On the table" products={featured} /> : null}
      {arrivals.length ? <Rail title="New arrivals" products={arrivals} /> : null}
      {reduced.length ? <Rail title="Recently reduced" products={reduced} /> : null}
      <section className="grid gap-8 border-t border-line px-4 py-12 md:grid-cols-2 md:items-start md:px-8">
        <div>
          <h2 className="text-3xl text-ink">From Ajja</h2>
          <p className="measure mt-4">{settings.story}</p>
          <p className="mt-4 border-t border-line pt-4 text-ink-soft">
            {settings.town}, {settings.region}
          </p>
        </div>
        {settings.ownerPhoto ? (
          <div className="photo-frame crop relative">
            <Image src={settings.ownerPhoto} alt={`${settings.ownerName} at the studio`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        ) : (
          <div className="photo-frame crop relative grid place-items-center p-6 text-center text-ink-soft">
            <p>A photo of Ajja will go here when he adds one.</p>
          </div>
        )}
      </section>
      {quotes.length ? (
        <section className="border-t border-line px-4 py-12 md:px-8" aria-labelledby="quotes-heading">
          <h2 id="quotes-heading" className="text-3xl text-ink">
            In their words
          </h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {quotes.map((quote) => (
              <blockquote key={quote.id} className="border-t border-line pt-4">
                <p className="font-display text-xl leading-relaxed">{quote.text}</p>
                <footer className="mt-3 text-ink-soft">{quote.name}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}
      <section className="border-t border-line px-4 py-12 md:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl text-ink">Visit</h2>
          <p className="mt-4">
            {settings.town}, {settings.region}
            {settings.address ? `, ${settings.address}` : ". The street address is not listed yet."}
          </p>
          <p className="mt-2 text-ink-soft">{open == null ? "Hours are not listed yet." : open ? "Open today." : "Closed today."}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="btn btn-primary" href={settings.mapUrl}>
              Open the map
            </a>
            <Link className="btn btn-secondary" href="/visit">
              Hours and the studio
            </Link>
          </div>
        </div>
      </section>
      {settings.faqs.length ? (
        <section className="border-t border-line px-4 py-12 md:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl text-ink">Questions</h2>
            <div className="mt-4 border-t border-line">
              {settings.faqs.map((faq) => (
                <details key={faq.q} className="group border-b border-line py-2">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-display text-xl text-ink">
                    <span>{faq.q}</span>
                    <span className="text-ink-soft transition-transform duration-200 ease-out group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="measure pb-3 text-ink-soft">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function CollectionTile({ collection }: { collection: PublicCollection }) {
  return (
    <figure>
      <Link href={`/c/${collection.slug}`} className="photo-frame crop relative block no-underline">
        {collection.imageUrl ? (
          <Image
            src={collection.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        ) : null}
        <span className="paper-label">{collection.name}</span>
      </Link>
      {collection.intro ? <figcaption className="mt-3 text-ink-soft">{collection.intro}</figcaption> : null}
    </figure>
  );
}

function Rail({ title, products }: { title: string; products: PublicProduct[] }) {
  const id = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <section className="border-t border-line px-4 py-12 md:px-8" aria-labelledby={id}>
      <h2 id={id} className="text-3xl text-ink">
        {title}
      </h2>
      <div className="hang mt-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} href={`/p/${product.slug}`} />
        ))}
      </div>
    </section>
  );
}
