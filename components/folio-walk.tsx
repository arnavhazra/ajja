"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { pieceTitle } from "./product-card";
import type { PublicProduct } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger);

/**
 * Pinned horizontal "folio walk": the viewport pins and a track of large
 * plates scrolls sideways as the user scrolls down — the signature editorial
 * move on award-tier archive sites. Under reduced motion it renders as a
 * simple horizontally scrollable row (no pin, no scrub).
 */
export function FolioWalk({ products }: { products: PublicProduct[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const items = products.slice(0, 8);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const distance = () => track.scrollWidth - section.clientWidth;
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    // Each plate settles gently as it crosses the viewport.
    const settleTriggers = gsap.utils.toArray<HTMLElement>("[data-folio-plate]").map((el) =>
      gsap.fromTo(
        el.querySelector(".folio-plate-img"),
        { scale: 1.06 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: el, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
        },
      ),
    );
    return () => {
      settleTriggers.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [items.length]);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section ref={sectionRef} data-reveal className="relative mt-24 overflow-hidden" aria-label="Featured folio walk">
      <div className="mx-auto flex max-w-[1440px] items-end justify-between px-4 md:px-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-terracotta">Folio Walk · Selected Works</p>
          <h2 className="mt-2 font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl" data-mask>
            <span className="mask-line"><span className="mask-line-inner">Walk the wall</span></span>
          </h2>
        </div>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-umber sm:block">
          Scroll — the plates pass in review
        </p>
      </div>

      <div
        ref={trackRef}
        className={
          reduced
            ? "mt-10 flex gap-8 overflow-x-auto px-4 pb-4 md:px-8"
            : "mt-10 flex w-max items-start gap-8 pl-4 md:pl-8"
        }
      >
        {items.map((product, i) => {
          const image = product.images[0];
          const title = pieceTitle(product.title, product.categorySlug, product.attributes);
          return (
            <Link
              key={product.id}
              href={`/p/${product.slug}`}
              data-folio-plate
              data-cursor="View"
              className="group block w-[72vw] shrink-0 sm:w-[46vw] lg:w-[32vw]"
            >
              <div className="weave-overlay relative overflow-hidden rounded-sm border-[6px] border-bone bg-bone-dark deckled-b archival-vignette">
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={title}
                      fill
                      sizes="(min-width: 1024px) 32vw, 72vw"
                      className="folio-plate-img object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.2em] text-umber">
                      Awaiting photograph
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <span className="card-index">PLATE {String(i + 1).padStart(2, "0")}</span>
                <span className="truncate font-serif text-lg text-ink transition-colors group-hover:text-terracotta">
                  {title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
