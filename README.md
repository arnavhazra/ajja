# megele.art

A direct-enquiry catalogue and private studio desk for a family art and woodwork studio in Collegeville, Pennsylvania. The public site presents real one-of-a-kind pieces; it intentionally has no cart or online payment flow.

## Stack

- Next.js 16, React, TypeScript strict, Tailwind CSS 4
- Neon Postgres through `@neondatabase/serverless` and Drizzle schema types
- Vercel Blob for artwork photographs
- Vercel cron for scheduled publishing and retention cleanup
- Vitest unit tests, Playwright production-build browser tests, Lighthouse CI

## Setup

1. Install pnpm dependencies: `pnpm install`
2. Copy `.env.example` to `.env.local` and fill the shop values. Never commit `.env*`.
3. Apply the SQL files in `drizzle/` to the target Neon branch in order.
4. Run the app: `pnpm dev`

The production build requires real `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `SESSION_SECRET`, and `CRON_SECRET` values because Next.js prerenders cached catalogue queries.

## Commands

- `pnpm dev` — local development server
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — strict TypeScript
- `pnpm test` — Vitest unit suite
- `pnpm test:e2e` — Playwright production-build suite through `playwright.prod.config.ts`
- `pnpm seed` — ingest local artwork photos into private drafts
- `pnpm admin:password owner@example.com` — create or reset a desk password
- `node scripts/bundle-budget.mjs` — enforce client-JavaScript budgets after a build
- `node scripts/shot.mjs <url> <name>` — capture desktop/mobile screenshots for design review

## Private desk

The desk lives at `/desk`. Authentication is checked inside server actions and API routes. Use plain desk language and prefer undo over destructive confirmation flows.

## Browser tests

`pnpm test:e2e` requires an isolated database and never falls back to production companions. Put fixture values in gitignored `.env.e2e`; see `HANDOFF.md` for the full TLS/blob-mock setup. Required names are documented in `.env.example`.

## Operational notes

- `HANDOFF.md` covers environment variables, backups, recovery, E2E, monitoring, and rollback.
- `DIRECTORY_OVERVIEW.md` is the current architecture map.
- `.impeccable/design-full.md` carries the full design-system document; root `DESIGN.md` is its compact map.
