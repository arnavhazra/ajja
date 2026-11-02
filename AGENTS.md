# Ajja

Shop and private desk for a family studio in Collegeville, Pennsylvania. Neon Postgres, Vercel Blob, Next.js 16.

## Commands

- `pnpm dev` — local site
- `pnpm build` — production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript
- `pnpm test` — Vitest
- `pnpm test:e2e` — Playwright
- `pnpm seed` — read photos, strip metadata, upload to Blob, create drafts

Seed looks at `SEED_DIR`, then `seed/photos`, then `/Users/arnavhazra/Downloads/ajja-art-site-assets`.

## Folder map

- `app/(shop)` — public pages
- `app/desk` — private desk, reached only by rewrite from `ADMIN_PATH`
- `app/api` — enquiries, events, upload token, backup, cron
- `lib` — database, auth, images, copy
- `drizzle/0001_init.sql` — schema already applied to Neon
- `components` — shared UI
- `tests` — unit tests
- `e2e` — browser tests

## Conventions

- Server components by default. `use client` only for galleries, filters, forms, and the header controls.
- Public reads use `use cache` and tags. Desk saves call `updateTag`.
- Money is integer cents. Empty price stays null.
- Do not invent product facts. Drafts stay off the shop.
- Authorise inside every desk action. The proxy rewrite is not enough.
- Plain words in the desk.

## Environment

See `HANDOFF.md`. Never commit `.env*`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
