# Changelog

## 2026-11-02

- Chose Neon Postgres, connected through the Vercel Marketplace, instead of Supabase. The free Supabase plan already had two active projects, and the shop should not share one of them.
- Database name on Neon: `neondb`. Region: Washington, D.C. (`iad1`), the closest Marketplace region to Collegeville, Pennsylvania. Plan: Neon Free.
- Removed `@supabase/supabase-js`. Queries go through Drizzle and `@neondatabase/serverless`.
- Created the shop tables in `drizzle/0001_init.sql` and applied them.
- Created a public Vercel Blob store, `ajja-studio`, in the same region, for photographs. Supabase Storage is not used.
- Vercel project: `ajja` on the team `arnav-hazras-projects`.

## 2026-11-02

- Public pages are up: home, shop, piece, category, studio, visit, about, policies, privacy, sold, saved, and search. People enquire first. The site does not take payment. Currency is USD.
- The desk is the secret path in `ADMIN_PATH`. Opening `/desk` directly is the public 404. The printed cheat sheet is that path plus `/help/print`.
- 39 poured-painting photographs were seeded as drafts with `node scripts/seed.mjs`. Titles and prices are empty. Paintings, Woodwork, and Handwork are labels he can rename. The photographs are not assigned to those categories.
- Shop data is on Neon Postgres. Photographs are on Vercel Blob. Drafts stay off the shop.
