---
name: website-release-gate
description: Mandatory pre-release verification gate for all public-facing web pages. Runs typecheck/lint/unit tests, a production build, and a headless Playwright audit across mobile/tablet/desktop viewports that fails on console errors, broken assets, horizontal overflow, stuck-at-opacity-0 elements, broken interactions, and reduced-motion regressions. Use before finishing any UI, CSS, layout, or public route change.
---

# Locked-Down Website Release Gate

Never declare a frontend task, PR, or deployment ready until every gate below passes with zero errors. This gate is for public-facing routes under `app/(shop)` and any shared component, stylesheet, or layout they render. Desk (`app/desk`) changes need Gates 1–2 against the desk routes you touched, not the shop sweep.

## Gate 1: Static & Build Integrity

1. `pnpm lint` — zero errors.
2. `pnpm typecheck` — zero errors.
3. `pnpm test` — Vitest green when the change can affect covered code.
4. `pnpm build` — production build with zero warnings treated as regressions.

## Gate 2: Multi-Viewport Headless Audit

Use the bundled audit script against a running production server:

```bash
pnpm build && pnpm start &  # or reuse a running :3000 server
node .agents/skills/website-release-gate/qa-audit.mjs http://127.0.0.1:3000 / /new-route
```

Pass every public route plus every route you modified. The script audits each route at **375x812 (mobile)**, **768x1024 (tablet)**, and **1440x900 (desktop)** and fails on:

1. **Console & page errors** — any `console.error`, uncaught `pageerror`, or hydration-mismatch warning.
2. **Broken assets or 4xx/5xx** — any image with `naturalWidth === 0`, or any request with status >= 400.
3. **Horizontal overflow** — `document.documentElement.scrollWidth > window.innerWidth`.
4. **Stuck invisible elements** — after scrolling top→bottom to trigger observers, no heading, CTA, or card may remain at `opacity: 0` / `visibility: hidden`.
5. **Interactions** — nav links, menu drawers, and primary CTAs respond without errors.

When the change can affect real data, auth, or cross-browser behavior, prefer the repo's full suite instead, which also seeds fixtures and covers WebKit/Firefox over HTTPS (required — the CSP's `upgrade-insecure-requests` kills plain-http fetches in WebKit):

```bash
# needs .env.e2e — see HANDOFF.md / e2e notes
CRON_SECRET=e2e-cron pnpm exec playwright test --config playwright.prod.config.ts
```

## Gate 3: Accessibility & Reduced Motion

The audit script also runs each route once with `reducedMotion: 'reduce'` — all content must stay visible and usable. In addition:

1. Interactive elements expose an accessible name (`aria-label` or visible text) and a visible focus ring.
2. Touch targets on mobile are ≥ 44×44 px — `e2e/tap-targets.spec.ts` already encodes this; run it when you changed interactive chrome.

## Gate 4: Visual Proof

The audit script writes `qa-screenshots/<route>/<viewport>.png` into `.qa-screenshots/` (gitignored). **Open the screenshots** (vision inspection) and check typography hierarchy, alignment, contrast, and spacing against `DESIGN.md`. List any visual fixes applied in the final report.

## Reporting

Finish with a one-line verdict per gate, and name anything that could not be run (e.g. missing `.env.e2e`, no Neon access) instead of skipping silently.
