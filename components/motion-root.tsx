"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Sole smooth-scroll engine (Lenis) wired to GSAP ScrollTrigger.
 * Runs the intro veil lift and the hero entry sequence — painting opens →
 * words cascade out of their masks → archive reveals — then masked-line
 * reveals, parallax scrub, and magnetic controls for the rest of the page.
 * Everything is bypassed under prefers-reduced-motion, so the final states
 * are always the no-JS default.
 */
export function MotionRoot() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links scroll through Lenis so ScrollTrigger stays in sync.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a[href]");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href) return;
      const hash = href.startsWith("#") ? href : href.startsWith("/#") ? href.slice(1) : null;
      if (!hash) return;
      if (href.startsWith("/#") && window.location.pathname !== "/") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -16 });
      history.replaceState(null, "", hash);
    };
    document.addEventListener("click", onClick);

    // Intro veil: the archive stamp lifts, then the page reveals.
    const intro = document.querySelector("[data-motion='intro']");
    const introTl = intro
      ? gsap
          .timeline()
          .set(intro, { autoAlpha: 1 })
          .from("[data-motion='intro-stamp']", {
            autoAlpha: 0,
            scale: 0.94,
            y: 10,
            duration: 0.45,
            ease: "power2.out",
          })
          .to(intro, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut", delay: 0.35 })
      : null;

    // Hero entry: the painting opens first, then the words cascade, then the ledger.
    const hero = document.querySelector("[data-motion='hero']");
    let tl: gsap.core.Timeline | null = null;
    if (hero) {
      tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: introTl ? 0.55 : 0 });
      tl.from("[data-motion='hero-specimen']", {
        autoAlpha: 0,
        scale: 0.96,
        clipPath: "inset(8% 8% 8% 8%)",
        duration: 1.2,
      })
        .from(
          "[data-motion='hero-stamp']",
          { autoAlpha: 0, y: 14, duration: 0.5 },
          "-=0.5",
        )
        .from(
          ".hero-word-inner",
          { autoAlpha: 0, yPercent: 110, duration: 0.7, stagger: 0.045 },
          "-=0.35",
        )
        .from(
          "[data-motion='hero-manifesto']",
          { autoAlpha: 0, y: 20, duration: 0.6 },
          "-=0.4",
        )
        .from(
          "[data-motion='hero-ctas']",
          { autoAlpha: 0, y: 16, duration: 0.5 },
          "-=0.35",
        )
        .from(
          "[data-motion='hero-ledger']",
          { autoAlpha: 0, y: 24, duration: 0.6 },
          "-=0.3",
        );

      // Specimen drifts against the manifesto column while scrolling.
      gsap.to("[data-motion='hero-specimen']", {
        yPercent: 4,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
      });
    }

    // Dossier entrance: gallery opens, meta staggers in.
    const dossier = document.querySelector("[data-motion='dossier']");
    let dossierTl: gsap.core.Timeline | null = null;
    if (dossier) {
      dossierTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      dossierTl
        .from("[data-motion='dossier-gallery']", {
          autoAlpha: 0,
          scale: 0.975,
          clipPath: "inset(4% 4% 4% 4%)",
          duration: 0.9,
        })
        .from(
          "[data-motion='dossier-meta'] > *",
          { autoAlpha: 0, y: 18, duration: 0.45, stagger: 0.06 },
          "-=0.45",
        );
    }

    // Scroll reveals for the archive sections below the hero.
    const triggers = gsap.utils.toArray<HTMLElement>("[data-reveal]").map((el) =>
      gsap.from(el, {
        autoAlpha: 0,
        y: 28,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      }),
    );

    // Masked line reveals: each .mask-line-inner rises out of its mask.
    const maskTriggers = gsap.utils
      .toArray<HTMLElement>("[data-mask]")
      .map((el) =>
        gsap.from(el.querySelectorAll(".mask-line-inner"), {
          yPercent: 110,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.04,
          scrollTrigger: { trigger: el, start: "top 86%" },
        }),
      );

    // Scrubbed story: words darken/lighten with scroll progress.
    const scrubTriggers = gsap.utils
      .toArray<HTMLElement>("[data-scrub-words]")
      .map((el) =>
        gsap.to(el.querySelectorAll(".scrub-word"), {
          opacity: 1,
          ease: "none",
          stagger: 0.04,
          scrollTrigger: { trigger: el, start: "top 78%", end: "top 34%", scrub: 0.5 },
        }),
      );

    // Gentle parallax inside marked elements.
    const parallaxTriggers = gsap.utils
      .toArray<HTMLElement>("[data-parallax]")
      .map((el) =>
        gsap.fromTo(
          el,
          { yPercent: -3 },
          {
            yPercent: 3,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: 0.8 },
          },
        ),
      );

    // Magnetic controls ease toward the pointer and spring back.
    const magneticCleanups: Array<() => void> = [];
    gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
      const strength = Number(el.dataset.magnetic ?? "0.32");
      const onMove = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
        yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
      };
      const onLeave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.45)" });
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      magneticCleanups.push(() => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      });
    });

    return () => {
      document.removeEventListener("click", onClick);
      introTl?.kill();
      tl?.kill();
      dossierTl?.kill();
      [...triggers, ...maskTriggers, ...scrubTriggers, ...parallaxTriggers].forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
      magneticCleanups.forEach((cleanup) => cleanup());
      ScrollTrigger.getAll().forEach((st) => st.kill());
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
