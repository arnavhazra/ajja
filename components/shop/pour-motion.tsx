"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { paintPour, pourFromDataset } from "@/lib/pour";

const POUR_VARS = ["pour", "pour-ink", "pour-text", "pour-text-night"] as const;

/** Lend the page the pigment of whatever painting is in front of the reader. */
function applyPour(el: HTMLElement) {
  const pour = pourFromDataset(el.dataset);
  if (pour) paintPour(pour);
}

/**
 * The Pour Room's one motion engine: Lenis smooth scroll + GSAP ScrollTrigger
 * for parallax drift, word scrub, and the pinned colour run. The pour accent and
 * the ask chip run on IntersectionObserver so they work with reduced motion too.
 */
export function PourMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const cleanups: (() => void)[] = [];

    // Pour accent: the section nearest the middle of the viewport wins.
    const pours = Array.from(document.querySelectorAll<HTMLElement>("[data-pour]"));
    if (pours[0]) applyPour(pours[0]);
    const pourObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) applyPour(entry.target as HTMLElement);
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    pours.forEach((el) => pourObserver.observe(el));
    cleanups.push(() => pourObserver.disconnect());

    // Ask chip: only once the hero has left the screen.
    const hero = document.getElementById("hero");
    const chip = document.querySelector<HTMLElement>(".pr-chip-cta");
    if (hero && chip) {
      const chipObserver = new IntersectionObserver(([entry]) => {
        chip.dataset.show = entry.isIntersecting ? "false" : "true";
      });
      chipObserver.observe(hero);
      cleanups.push(() => chipObserver.disconnect());
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -72 }, autoRaf: false });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el) => {
          const amount = Number(el.dataset.drift) || 8;
          gsap.fromTo(
            el,
            { yPercent: -amount },
            {
              yPercent: amount,
              ease: "none",
              scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-scrub-words]").forEach((el) => {
          const words = el.querySelectorAll(".pr-word");
          gsap.fromTo(
            words,
            { opacity: 0.22 },
            {
              opacity: 1,
              ease: "none",
              stagger: 0.08,
              scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
            },
          );
        });

        // The colour run pins and slides sideways only when it is wider than the screen.
        gsap.utils.toArray<HTMLElement>("[data-run]").forEach((section) => {
          const track = section.querySelector<HTMLElement>("[data-run-track]");
          if (!track) return;
          const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
          if (distance() < 80) return;
          section.dataset.pinned = "true";
          gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top 72px",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });
        });
      });

      root.classList.add("pr-motion");
      cleanups.push(() => {
        ctx.revert();
        gsap.ticker.remove(tick);
        lenis.destroy();
        root.classList.remove("pr-motion");
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
      for (const name of POUR_VARS) root.style.removeProperty(`--${name}`);
    };
  }, []);

  return null;
}
