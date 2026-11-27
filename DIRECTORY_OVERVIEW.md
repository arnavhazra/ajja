# Ajja — Directory & Architecture Overview

## Summary

megele.art is a Next.js 16 direct-enquiry catalogue plus a private studio desk. Public visitors browse real pieces and send enquiries; the desk owner photographs, describes, prices, publishes, and tracks those pieces. There is no checkout and no invented catalogue content.

## Runtime architecture

- **Public storefront**: `app/(home)` and `app/(shop)` render cached public catalogue reads. Shared chrome is consolidated in `components/public-shell.tsx`.
- **Private desk**: `app/desk` is reached through the secret `ADMIN_PATH` rewrite in `proxy.ts`. The rewrite is not authorization: desk server actions call `actor()`/`requireSession()`, and desk API routes check the session.
- **Data access**: `lib/public-data.ts` covers cached public reads; `lib/desk-data.ts` covers uncached desk reads; `lib/desk-actions/` groups writes by domain.
- **Database**: Neon Postgres. `lib/db/schema.ts` is the typed Drizzle schema; `drizzle/*.sql` is the applied migration chain.
- **Images**: Vercel Blob. Uploads are size/type checked, converted to WebP, stripped of metadata, given blur data, and reference-checked before deletion.
- **Public state**: money is integer cents, public reads use cache tags, and hidden/drafted/trashed pieces stay off public queries.

## Directory map

```text
app/
  (home)/              home material index and enquiry surface
  (shop)/              category, piece, policies, privacy routes
  desk/                private operational desk
  api/                 events, saved pieces, cron, desk export/backup/upload token
components/
  shop/                storefront interactions and public pieces
  desk/                desk forms, navigation, tables, upload/review UI
  public-shell.tsx     shared storefront header/footer/provider shell
  site-header.tsx      public masthead and mobile menu
  site-footer.tsx      pigment ribbon footer
lib/
  auth.ts              sessions, password/code/staff sign-in, password changes
  public-data.ts       cached public catalogue/settings reads
  public-actions.ts    public enquiry writes
  desk-data.ts         desk reads
  desk-actions/        authenticated desk writes
  db/                  Neon connection and Drizzle schema
  images.ts            image sniffing, optimization, Blob storage
  blob-retention.ts    reference-checked Blob deletion
  request-ip.ts        shared proxy-aware client IP extraction
  pigment.ts           per-piece sampled colour extraction
drizzle/               ordered SQL migrations
scripts/               seed, password, screenshot, enhancement, bundle-budget tools
tests/                 Vitest unit tests
e2e/                   production-build Playwright fixtures/specs/blob mock
.github/workflows/     lint/typecheck/unit/build, bundle budget, Lighthouse, E2E
```

## Important files

- `app/(home)/page.tsx` — material-index home composition.
- `app/(shop)/p/[slug]/page.tsx` — piece monograph, enquiry prefill, JSON-LD, related work.
- `components/shop/piece-viewer.tsx` — fit-contained artwork viewer and accessible figure picker.
- `components/shop/collectors-folio.tsx` — local saved-piece folio and multi-piece enquiry handoff.
- `components/desk/pieces-table.tsx` — dense inventory quick-edit table.
- `lib/desk-actions/pieces.ts` — piece ingest, editing, status transitions, duplication, trash/restore, undo.
- `lib/env.ts` + `instrumentation.ts` — runtime environment validation outside the production build phase.
- `proxy.ts` — secret desk rewrite and public route protection.
- `next.config.ts` — image security, security headers, bundling, and cache behavior.

## Verification model

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` are the base gate.
- `node scripts/bundle-budget.mjs` runs in CI after build.
- `.agents/skills/website-release-gate/qa-audit.mjs` audits public routes at mobile/tablet/desktop widths.
- `pnpm test:e2e` uses `playwright.prod.config.ts`, TLS, an isolated database, and the Blob mock; it never uses production companion variables.

## Design and documentation truth

- `.impeccable/design-full.md` is the full Material Index design document.
- `DESIGN.md` is the compact machine-loaded map to that document.
- `HANDOFF.md` is the operational runbook.
- `AGENTS.md` is the concise agent-facing command and convention summary.
