# Ajja (`megele.art`) — Complete Execution Runbook for Stage-by-Stage Agent Implementation

Read this entire file before running a single command. It is written so a small, fast coding agent can execute one stage at a time with zero guesswork, zero production damage, and deterministic verification.

---

## 1. Where We Are Right Now

### 1.1 Git & Deployment State
- **Live production (`https://megele.art`)** is served by Vercel project `prj_5hj1Z8loRQPTOSkS2QP2OYES26cC` (team `team_LugQlfvXCxxQMhM22wPHEUDe`) from GitHub `arnavhazra/ajja` branch `main` at commit **`ece832eb15bd7a87b4b0ae7a840ba203d4d707a6`** (`fix: rebuild home lower sections on material system, restore footer, upgrade next`).
- **Important:** Pushing to `main` triggers an automatic production deploy on Vercel. **Do NOT push to `main` during implementation.** Work on a local branch (`git switch -c fix/verandah-index-launch` after syncing with `origin/main`).
- **Local `HEAD` divergence:** Local `main` is currently at **`0031928bd5182f3242baa8942266d8ec84ab2f77`** (1 commit behind `origin/main`). `origin/main` has already been fetched (`git fetch origin`).
- What `ece832eb` on `origin/main` already fixed (do NOT redo or revert):
  - Rebuilt `components/shop/studio-intro.tsx`, `components/shop/acquisition-faq.tsx`, and `components/shop/commission-form.tsx` off dead `.pr-*` classes onto `.bench`, `.steps`, `details.term`, and `.note-card`.
  - Wrapped the home enquiry form in `<section id="inquire">` inside `app/(home)/page.tsx`.
  - Added `<SiteFooter>` and `brand.name` (`megele.art`) to `app/(home)/layout.tsx`.
  - Deleted `lib/pour.ts`, `components/shop/split-words.tsx`, and ~665 lines of dead `.pr-*` / `.pour-room` CSS in `app/globals.css`.
  - Upgraded `next` to `16.4.6`.

### 1.2 Current Uncommitted Working Tree Inventory
Run `git status --short` before touching anything. You will see three groups of files:

1. **Approved fixes from the audit session — KEEP all three:**
   - `app/api/desk/backup/route.ts`: Replaced illegal Route Handler `updateTag("settings")` with `revalidateTag("settings", { expire: 0 })`; fails fast with HTTP `502` before writing `lastBackupAt` if any image download fails; builds ZIP before updating `site_settings`; sets `Cache-Control: private, no-store`.
   - `app/desk/pieces/page.tsx`: Removed the invalid nested `<form action={emptyTrash}>` from inside the GET search `<form>`; kept `<input type="hidden" name="trash" value="1" />` so searching inside Trash stays in Trash; added plain 30-day restore guidance.
   - `lib/auth.ts`: Made `getSession()` strictly read-only (removed the rolling cookie write that violated Next.js 16 Server Component render rules).

2. **Pre-existing user local edits — KEEP all four (reconcile `package.json` / `pnpm-lock.yaml` cleanly with `origin/main`):**
   - `next.config.ts`: Adds `experimental: { agentUpgrade: "security" }`.
   - `package.json` + `pnpm-lock.yaml`: Upgrades both `next` and `eslint-config-next` to `16.4.6`.
   - `scripts/shot.mjs`: Waits for `main img, article img` before taking screenshots.

3. **E2E isolation edits — KEEP AND FIX in Stage 0:**
   - `playwright.config.ts`, `e2e/fixture-env.ts` (untracked), `e2e/shop.spec.ts`, `e2e/auth-security.spec.ts`, `e2e/tap-targets.spec.ts`, `e2e/visual-audit.spec.ts`.
   - **What works:** Stopped reading `.env.local` into Playwright, moved E2E server to `127.0.0.1:3210` with `reuseExistingServer: false`, replaced `OWNER_EMAIL`/`DEV_ADMIN_EMAIL` fallbacks with `@example.test` fixture accounts, stopped wiping `rate_limits` and `site_settings.whatsapp`.
   - **What is broken and MUST be fixed in Stage 0:** `e2e/fixture-env.ts` currently forces `E2E_DATABASE_URL` to have hostname `localhost` / `127.0.0.1` / `::1`. However, `lib/db/index.ts` and all `e2e/*.spec.ts` files use `neon(url)` from `@neondatabase/serverless`, which speaks Neon's HTTPS SQL protocol (`https://<host>/sql`) and fails against plain local TCP Postgres unless a Neon HTTP proxy is running. See Stage 0.3 for the exact fix.

4. **Untracked / Legacy Repo Clutter (Cleanliness Rules):**
   - `seed/photos/` (60 untracked `.HEIC` and `.jpeg` original studio photos): **NEVER delete and NEVER commit.** Add `/seed/photos/` to `.gitignore`.
   - `artifacts/` (untracked ~25 MB of historical screenshots, `enhance-sample/`, `mock-home*`, `live.css`) and `supabase/` (empty leftover `.temp` folder): **NEVER `rm -rf` untracked user folders.** Add `/artifacts/`, `/supabase/`, and `/.env.e2e` to `.gitignore` so `git status` stays clean without deleting local files.
   - `ajja_atelier_archive_storefront.html` (tracked 2,150-line monolithic HTML prototype at repo root): Remove from git tracking in Stage 5 (`git rm ajja_atelier_archive_storefront.html`) after confirming nothing imports it.
   - `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`: Default create-next-app SVGs; remove via `git rm` in Stage 5 after confirming zero references.

---

## 2. Connections & Environment Rules (Read Carefully)

- **Never print, log, echo, or commit `.env*` values, database URLs, tokens, or passwords.** To inspect `.env.local` safely, inspect variable names only, never values.
- **Why `.env.local` is dangerous for automated tests:** `.env.local` points `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` at **live production** (`muddy-star-73595540` primary branch `br-dark-sun-b70k1dea`) AND has `E2E_ISOLATED_DB` set! Never trust `E2E_ISOLATED_DB` from `.env.local`.
- **Database (`Neon Postgres`):**
  - Project ID: `muddy-star-73595540` (`aws-us-east-1`, Postgres 18).
  - Production branch: `br-dark-sun-b70k1dea` (`main`) — **READ-ONLY / HANDS OFF** during automated tests.
  - Non-production branches: `br-icy-forest-b736q1ru` (`proofcall`), `br-purple-dream-b7yylcc8` (`devin-wet-edge-refresh`), or create a fresh ephemeral Neon branch (e.g. `e2e-isolated`) with `drizzle/0001_init.sql` + `drizzle/0002_admin_password.sql` applied. Its endpoint hostname (`ep-*.aws.neon.tech`) is distinct from the production endpoint hostname in `.env.local`, and works natively with `@neondatabase/serverless` over HTTPS!
- **Build (`pnpm build`):**
  - Because `next.config.ts` sets `cacheComponents: true`, `pnpm build` executes `lib/public-data.ts` queries during static page generation and requires a reachable Neon HTTP `DATABASE_URL`. Run `pnpm build` pointing `DATABASE_URL` at the isolated Neon test branch (or read-only against a valid Neon branch — `pnpm build` performs `SELECT` queries only).
- **Blob Storage (`@vercel/blob`):**
  - `BLOB_READ_WRITE_TOKEN` in `.env.local` is the live store. Do not run upload/delete tests against it; `e2e/shop.spec.ts` skips the upload test unless `E2E_BLOB_READ_WRITE_TOKEN` is explicitly provided for a separate test Blob store.
- **Email (`Resend`) & AI Photo Tidy (`OpenRouter` / `Gemini`):**
  - Keep `RESEND_API_KEY=""`, `OPENROUTER_API_KEY=""`, `GEMINI_API_KEY=""` in all test runs.
  - In application code (Stage 1), wrap `notifyOwner()` in `try/catch` with `AbortSignal.timeout(5000)` so a Resend outage or missing key can **never** fail a visitor's enquiry submission after it is saved in Postgres.
  - Disable automatic AI photo enhancement (`enhanceUploadedPhoto`) on upload so Ajja's real studio photograph is never silently replaced as the cover by an AI-generated image.

---

## 3. Global Coding Rules (Enforced in Every Stage)

1. **Read Next.js 16.4.6 docs first:** Before touching Next APIs (caching, cookies, route handlers, forms, metadata, `next/image`), read the matching file in `node_modules/next/dist/docs/`.
2. **TypeScript strict, zero `any`:** Named exports everywhere except Next.js `page.tsx`, `layout.tsx`, `route.ts`, `not-found.tsx`, `opengraph-image.tsx`, `icon.tsx`, `apple-icon.tsx`, `manifest.ts`, `robots.ts`, `sitemap.ts`.
3. **Server Components by default:** Only add `"use client"` when browser state/events are required.
4. **Kebab-case filenames** and use `cn` from `@/lib/cn` for conditional classes.
5. **Money is integer cents (`priceMinor: number | null`), currency is `"USD"`:** Empty price stays `null` and renders `"Ask for the price"` (or `"Ask for price"` consistently — never `$0`, never auto-converted foreign currencies).
6. **Content honesty:** Never invent titles, dimensions, materials, hours, street addresses, testimonials, Konkani translations, or Mangalore origin claims. The studio is in Collegeville, Pennsylvania; Konkani + Mangalorean heritage informs the *architectural craft aesthetic* unless the family enters explicit story words in Settings.
7. **Security inside every write:** `proxy.ts` rewrites `/{ADMIN_PATH}` to `/desk`, which is obscurity, NOT auth. Every Server Action and desk Route Handler must verify `requireSession()` / `getSession()` **before** reading private rows, fetching URLs, or mutating data, and must write an `auditLog` row.
8. **Verification after EVERY stage:** Run `pnpm lint && pnpm typecheck && pnpm test` at the end of each stage before moving on.

---

## 4. Stage-by-Stage Execution Instructions

Execute these stages **in order (Stage 0 → Stage 6)**. Make one clean commit per stage on branch `fix/verandah-index-launch` (do NOT push unless asked by the user).

---

### Stage 0 — Sync with `origin/main`, Clean `.gitignore`, and Fix Neon-Compatible E2E Isolation

#### Files to touch
- `.gitignore`
- `e2e/fixture-env.ts`
- `e2e/isolated-db.ts`
- `package.json` / `pnpm-lock.yaml` (if needed after stash pop)

#### Exact steps
1. **Sync local branch onto `origin/main` (`ece832eb`) without losing current work:**
   - Temporarily move untracked `e2e/fixture-env.ts` aside (or `git stash push -u -- ':(exclude)seed/photos'`), create/switch branch from `origin/main`:
     ```bash
     git checkout -B fix/verandah-index-launch origin/main
     ```
   - Re-apply the preserved changes cleanly:
     - `app/api/desk/backup/route.ts`
     - `app/desk/pieces/page.tsx`
     - `lib/auth.ts`
     - `next.config.ts`
     - `scripts/shot.mjs`
     - `package.json` (`eslint-config-next` `"16.4.6"` alongside `next` `"16.4.6"`, then run `pnpm install` if lockfile differs)
     - `playwright.config.ts`, `e2e/fixture-env.ts`, `e2e/auth-security.spec.ts`, `e2e/shop.spec.ts`, `e2e/tap-targets.spec.ts`, `e2e/visual-audit.spec.ts`.

2. **Clean up `.gitignore` so untracked local assets never pollute `git status`:**
   Append to `.gitignore`:
   ```gitignore
   # local studio assets & audit artifacts
   /seed/photos/
   /artifacts/
   /supabase/
   .env*
   !.env.example
   ```
   Verify `git status --short` no longer lists `seed/photos/IMG_*`.

3. **Fix `e2e/fixture-env.ts` and `e2e/isolated-db.ts` so `@neondatabase/serverless` works safely against an isolated Neon test branch:**
   - Why: `neon(url)` uses HTTPS (`https://<host>/sql`). Blocking all non-localhost URLs makes E2E impossible to run against an isolated Neon branch, while trusting `E2E_ISOLATED_DB=1` from `.env.local` allowed production clobbering.
   - In `e2e/fixture-env.ts`:
     - Parse `.env.local` **only to extract forbidden production hostnames** (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `PGHOST`, `PGHOST_UNPOOLED`, `POSTGRES_HOST`) into a `Set<string>` — never copy values into `process.env` and never log them!
     - Validate `E2E_DATABASE_URL`:
       1. Must be a valid `postgres:` / `postgresql:` URL.
       2. Its `hostname` **must NOT match** any hostname found in `.env.local` (if it matches, throw `"Refusing to run E2E against the .env.local database host. Supply a separate Neon test branch URL in E2E_DATABASE_URL."`).
       3. Allow either a localhost hostname (`localhost`, `127.0.0.1`, `::1`, `[::1]`) OR a `.neon.tech` branch endpoint hostname (`*.neon.tech`) when `E2E_ISOLATED === "1"` and the hostname is not in the forbidden `.env.local` set.
     - Also scrub all `PG*`, `POSTGRES_*`, and `NEON_*` companion variables in `applyFixtureEnv()` so nothing falls back to `.env.local` companions.
   - Update `e2e/isolated-db.ts` to check `process.env.E2E_ISOLATED === "1"` (matching `fixture-env.ts`) instead of `E2E_ISOLATED_DB === "1"` (which is set in `.env.local`!).

4. **Stage 0 Gate:**
   - Run `pnpm lint && pnpm typecheck && pnpm test`.
   - Run `E2E_ISOLATED=1 E2E_DATABASE_URL=postgresql://e2e:e2e@ep-isolated-fixture-000000.us-east-1.aws.neon.tech/neondb E2E_ADMIN_PATH=e2e-desk-fixture-path E2E_SESSION_SECRET=fixture-secret-long pnpm exec playwright test --list` (must list 14 tests).
   - Verify fail-closed: passing the same host as `.env.local` (test via a unit test with mocked forbidden host set, never printing real `.env.local`) must throw!

---

### Stage 1 — Backend Safety, Auth Order, Single Publish Gate, Safe Undo/Blob Retention, and Bulletproof Enquiries

#### Files to touch
- `lib/piece-readiness.ts`
- `lib/desk-actions.ts`
- `lib/public-actions.ts`
- `lib/public-data.ts`
- `lib/category-index.ts`
- `app/api/cron/publish/route.ts`
- `app/api/desk/export/route.ts`
- `app/api/desk/messages/route.ts`
- `app/api/desk/upload-token/route.ts`
- `components/json-ld.tsx`
- `proxy.ts`
- `tests/` (add unit tests covering readiness gate, JSON-LD escaping, slug stability, and shared-Blob safety)

#### Exact fixes required
1. **Fix auth-before-IO in `lib/desk-actions.ts`:**
   - `rotateImage` (around line 1045) and `cropImage` (around line 1055) currently query `productImages`, `fetch(image.url)`, and run `sharp(...)` **before** calling `replaceImage` (which calls `actor()`).
   - Put `await actor();` as the **very first line** of both `rotateImage` and `cropImage`, and validate `imageId` with `z.string().uuid()`.

2. **Strip spoofed internal headers in `proxy.ts`:**
   - Currently `proxy.ts` checks `const rewritten = request.headers.get("x-ajja-rewritten") === "1";` — an external request sending `x-ajja-rewritten: 1` or `x-ajja-prefix: /evil` could spoof `deskPrefix()` redirects!
   - Fix in `proxy.ts`: Strip `x-ajja-desk`, `x-ajja-prefix`, and `x-ajja-rewritten` from incoming external requests unless `ADMIN_PATH` matched in this proxy invocation; even simpler and safer, derive `deskPrefix()` in `lib/desk-path.ts` directly from `process.env.ADMIN_PATH ? \`/\${process.env.ADMIN_PATH.replace(/^\\/+|\\/+$/g, "")}\` : ""` when `headers().get("x-ajja-desk") === "1"`, so client-sent `x-ajja-prefix` can never inject an open redirect!

3. **Enforce ONE server-side publish/schedule readiness policy everywhere (`lib/piece-readiness.ts` + `lib/desk-actions.ts` + `app/api/cron/publish/route.ts`):**
   - Create helper `canPublishPiece(product: { title?: string | null; deletedAt?: Date | null }, imageCount: number): { ok: true } | { ok: false; reason: string }` in `lib/piece-readiness.ts`:
     - Rejects if `product.deletedAt != null` (`"Restore this piece from the trash first."`).
     - Rejects if `imageCount < 1` (`"Add a photo before showing this piece on the site."`).
     - Rejects if `!product.title?.trim()` or `/^(title not written yet|studio study\b)/i.test(product.title.trim())` (`"Give this piece a name before showing it on the site. You can write Untitled if it has no title."`). Note: `"Untitled"` IS explicitly allowed! Blank price (`priceMinor === null`) IS explicitly allowed!
   - Enforce `canPublishPiece` whenever a piece transitions into `status === "published"` or `status === "scheduled"` in **all six write paths**:
     1. `publishPiece` / `setStatus(..., "published", ...)`
     2. `savePiece` (when `parsed.data.status` is `"published"` or `"scheduled"`)
     3. `saveInlineField` (when `intent === "status"` and `value` is `"published"` or `"scheduled"`)
     4. `bulkApply` (when `action === "publish"`, skip unready pieces and report `${skipped} needed a photo or name first` instead of publishing half-baked drafts!)
     5. `confirmImport` (when CSV sets status to `"published"` / `"on the site"` / `"scheduled"`)
     6. `app/api/cron/publish/route.ts` (only promote scheduled pieces that have at least one image and a non-empty real title).
   - Also in `sellPiece` / `setStatus(..., "sold", ...)` / `bulkApply` (`action === "sold"`): if a piece is currently `"draft"` and fails `canPublishPiece`, do NOT let marking it `"sold"` put an unnamed/photoless draft onto the public shop (`listed()` in `lib/public-data.ts` includes `'sold'`!). Either require `canPublishPiece` for `"sold"` too, or keep photoless/unnamed drafts off `listed()`. Requiring `canPublishPiece` for `"sold"` AND adding `exists (select 1 from product_images ...)` in `listed()` makes public leakage impossible!
   - In `restorePiece`: when restoring from Trash, set `deletedAt: null, status: "draft"` so a trashed item never surprises Ajja by jumping straight back onto the live public site without review; tell him `"Restored as a private draft."`

4. **Disable silent AI cover hijack & protect shared Blobs + single-use Undo (`lib/desk-actions.ts`, `app/api/cron/publish/route.ts`):**
   - In `ingestUpload` and `addPhotoToPiece`: stop calling `after(() => enhanceUploadedPhoto(...))` automatically. Ajja's uploaded studio photo must stay untouched at `sortOrder: 0`.
   - Fix `dropBlobIfUnused(url)` in `lib/desk-actions.ts` AND trash purge in `app/api/cron/publish/route.ts`:
     - Before calling `del(url)`, verify the URL is NOT referenced in:
       1. Any row of `product_images` (for other products / duplicates),
       2. `site_settings` (`heroImage` or `ownerPhoto`),
       3. `categories.image_url` or `collections.image_url`,
       4. Non-undone `product_versions` snapshots created within the last 30 days (`snapshot->'images'` JSONB check: `not exists (select 1 from product_versions pv where pv.undone_at is null and pv.created_at > now() - interval '30 days' and pv.snapshot::text like '%' || ${url} || '%')`).
   - In `restoreVersion(versionId)`:
     - Check `if (!version?.productId || version.undoneAt) return "";` so an already-used Undo token cannot be replayed a second time to clobber newer edits!
   - Unify slug stability across `savePiece`, `saveInlineField`, `sprintSave`, and `saveAboutPiece`:
     - Replace `current.slug.startsWith("piece-") || current.title !== ...` with `isProvisionalSlug(current.slug)`! Once a piece has a real non-provisional slug, renaming its title should keep its established URL stable (just as `saveAboutPiece` already documents on line 613 of `lib/desk-actions.ts`), or if changed, always write a loop-free redirect (`fromPath !== toPath`, delete any reverse redirect `fromPath = nextPath` first so `/p/a -> /p/b -> /p/a` redirect loops can NEVER happen!).

5. **Cover/Hero safety & JSON-LD XSS safety:**
   - In `lib/category-index.ts` `coverForCategory`: remove line 35 (`return { id: "", url: imageUrl, ... }`) when `imageUrl` does not match any public piece's image unless `imageUrl` passes `isAllowedBlobUrl` (same `*.public.blob.vercel-storage.com` check as `next.config.ts`). Otherwise an arbitrary external URL entered in Groups crashes `next/image` at render time because `next.config.ts` only allows `*.public.blob.vercel-storage.com`!
   - In `setAsHeroImage` (`lib/desk-actions.ts`): only allow setting a hero image from a `"published"` non-deleted piece (or warn `"Put this piece on the site first before making it the homepage photo."`).
   - In `components/json-ld.tsx`: escape `<` as `\u003c` (`JSON.stringify(data).replace(/</g, "\\u003c")`) per Next.js JSON-LD security docs so a piece title/description containing `</script>` can never break out of `<script type="application/ld+json">`.
   - Add `"Cache-Control": "private, no-store"` to `app/api/desk/export/route.ts`, `app/api/desk/messages/route.ts`, and `app/api/desk/upload-token/route.ts`.

6. **Bulletproof `sendEnquiry` (`lib/public-actions.ts`):**
   - If `productId` is provided, verify the product exists and is publicly listed (`deletedAt is null` and `status in ('published', 'sold')`); if not, null out `productId` rather than failing a foreign-key constraint if a piece was just deleted!
   - Wrap `await notifyOwner(...)` in `try { ... } catch (err) { console.error("Owner email notification failed", err instanceof Error ? err.message : "unknown"); }` and pass `signal: AbortSignal.timeout(5000)` to `fetch("https://api.resend.com/emails", ...)` so a slow or broken email provider NEVER causes the saved database enquiry to look failed to the visitor!

7. **Stage 1 Gate:**
   - Add unit tests in `tests/` for `canPublishPiece`, `coverForCategory` external-URL rejection, `JsonLd` `</script>` escaping, and redirect loop prevention.
   - Run `pnpm lint && pnpm typecheck && pnpm test` — all must pass.

---

### Stage 2 — Foolproof Desk for an 86-Year-Old Grandfather (`app/desk/*`, `components/desk/*`, `app/desk/desk.css`)

**Design & UX rule for this stage:** Imagine an 86-year-old grandfather using an iPad or desktop browser on his own. Every screen has ONE obvious primary job, >= 20px body text, >= 56px primary buttons and inputs, zero technical jargon ("SKU", "Image address", "0 to 1", "Theme: Fraunces", "Tidied cover sweep"), permanent labels above inputs, and clear recovery when something goes wrong.

#### Files to touch
- `app/desk/desk.css`
- `components/desk/nav.tsx`
- `app/desk/page.tsx`
- `app/desk/add/page.tsx`
- `components/desk/upload.tsx`
- `components/desk/draft-about-form.tsx`
- `app/desk/pieces/page.tsx`
- `components/desk/pieces-table.tsx`
- `app/desk/pieces/[id]/page.tsx`
- `components/desk/editor-form.tsx`
- `components/desk/photo-manager.tsx`
- `app/desk/review/page.tsx`
- `app/desk/messages/page.tsx`
- `app/desk/home/page.tsx`
- `app/desk/groups/page.tsx`
- `app/desk/settings/page.tsx`
- `app/desk/files/page.tsx`

#### Exact UX fixes required
1. **Navigation & Help Always Visible (`components/desk/nav.tsx`, `app/desk/desk.css`):**
   - Currently `.desk-foot` (which holds **Help** and **Sign out**) has `display: none` below `64rem` (1024px)! On an iPad in portrait or a phone, Ajja literally cannot see **Help** or **Sign out**!
   - Fix: Include **Help** directly in the visible navigation bar at all widths (and keep Sign out reachable in Account / top bar), and ensure `.desk-link` meets the 48–56px touch height cleanly.
   - Keep the primary Desk section strictly to: **Today**, **Add a piece**, **My pieces**, **Messages** (with waiting badge), **Help**. Put **Review drafts**, **Groups**, **Files**, **History**, **Settings** under **More**.

2. **Sign-in Screen (`app/desk/page.tsx`):**
   - Remove the top tab bar that puts `Staff app code` right next to `Password` as an equal choice.
   - Show the single **Sign in to the desk** password form first, with a large `"Show password"` toggle button (client island or small toggle) so Ajja can see what he typed before 5 typos lock him out for 15 minutes!
   - Put quiet plain links *below* the form: `"Forgot password? Email me a sign-in code"` (when `emailCodeReady` is true) and a small `"Staff sign-in"` link at the very bottom (when `staffReady` is true).

3. **Add a Piece (`app/desk/add/page.tsx`, `components/desk/upload.tsx`, `components/desk/draft-about-form.tsx`):**
   - In `PhotoUpload`: make the file picker look like an unmistakable large button/drop card (`min-height: 88px`), plain wording `"Choose photo from this device"`, and move the multi-file `"Put all of these photos on one piece"` checkbox inside an optional disclosure or clear secondary toggle so single-photo upload is effortless. Fix relative URL navigation (`new URL(`${prefix}/add?piece=${ids[0]}`, window.location.origin)` — pass `prefix` prop to `PhotoUpload`! Look at `components/desk/upload.tsx` line 83: `new URL("add?piece=...", window.location.href)` breaks if current URL has a trailing slash!).
   - In `DraftAboutForm`:
     - Labels: **Name** (hint: `"Write a name, or write Untitled."`), **Kind of work** (instead of `"One art form"`, default option `"Choose later"`), **Words about this piece (optional)**, **Price in US dollars (optional — leave blank if people should ask)**.
   - In `Review` (`app/desk/add/page.tsx`):
     - If `!canPublishPiece(product, images.length).ok`, show a calm yellow notice explaining what is needed (e.g. `"Give this piece a name first"`) and link back to **About this piece**, disabling `"Show on site"` until ready.
     - Rename `"Save and leave"` to `"Keep as private draft"` so Ajja is 100% certain nothing goes public when he leaves.

4. **My Pieces & Piece Editor (`app/desk/pieces/page.tsx`, `components/desk/pieces-table.tsx`, `components/desk/editor-form.tsx`, `components/desk/photo-manager.tsx`, `app/desk/review/page.tsx`):**
   - On `app/desk/pieces/page.tsx`: add clear top filter tabs (**All**, **Drafts**, **On the site**, **Sold**, **Hidden**, **Trash**) with `min-height: 48px` so Ajja doesn't have to use a tiny `<select>` + `"Show"` button just to switch between Drafts and On the site!
   - In `components/desk/pieces-table.tsx`: increase inline inputs/selects from tiny `h-9` (36px — violates the 44px/56px floor!) to `min-h-12` (48px+); keep primary row actions obvious (**Edit**, **Continue draft** for drafts, **Mark as sold** / **Hide** for live pieces).
   - In `components/desk/editor-form.tsx`:
     - Put the 5 everyday fields at the top in plain language: **Name**, **Kind of work** (Group), **Price in US dollars** (`"Leave blank if people should ask"`), **Size** (no invented placeholder — use format hint `"Example: 18 × 24 inches"`), **Words for the shop**, **Status**.
     - Tuck power-user/catalog fields (**Crossed-out price**, **Condition**, **Quantity**, **SKU**, **Tags**, **Extra attributes**, **Scheduled time (Eastern Time — checked once daily)**, **Private notes**) inside a clean `<details>` block titled **"More details (optional)"** so Ajja isn't staring at 18 form inputs every time he edits a painting! Remove `Show in the studio` checkbox if unused publicly, or keep inside More details.
   - In `components/desk/photo-manager.tsx`:
     - Fix the bug on line 47 (`disabled={index === images.length - 1}` -> `disabled={index === originals.length - 1}`) and pass `originals.map((item) => item.id)` to `DragPhoto` so hidden enhanced images don't break ordering!
     - Tuck **Fine crop margins** (`Left %`, `Top %`, `Width %`, `Height %`) inside `<details><summary>Trim photo edges (optional)</summary>...</details>` and make its inputs at least `min-h-12`.
     - Remove `"Set as homepage hero"` if the piece is still a draft (or show a plain hint `"Put this piece on the site first to use it on the home page"`).
   - In `app/desk/review/page.tsx`:
     - Remove the fictional placeholder `"e.g. Cobalt pour no. 3"` — replace with `"Write a name, or Untitled"`. Keep image `object-contain` (not cropped `object-cover`) so Ajja sees the whole piece he is naming!

5. **Messages, Home Settings, Groups, Settings, Files (`app/desk/messages/page.tsx`, `app/desk/home/page.tsx`, `app/desk/groups/page.tsx`, `app/desk/settings/page.tsx`, `app/desk/files/page.tsx`):**
   - In `app/desk/messages/page.tsx`:
     - Add `aria-current="page"` styling on the active status tab (**All**, **New**, **Replied**, **Closed**).
     - Add a `mailto:` **"Reply by email"** button when `row.contact.includes("@")` alongside **"Reply on WhatsApp"** when `phone.length >= 10`! (Right now if someone enters an email address, Ajja gets NO reply button at all!) Neither link auto-marks as Replied until Ajja clicks **Mark replied**.
     - Fix bulk select height from `h-9` to `min-h-12`. Move message retention days into `<details><summary>Message cleanup setting</summary>...</details>`.
   - In `app/desk/home/page.tsx`:
     - Remove the dead **Theme** (`Walnut`/`Clay`/`Ink`) and **Headings** (`Spectral`/`Newsreader`) dropdowns and numeric `0 to 1` focal textboxes (`heroFocalX`, `heroFocalY` — preserve existing values via `<input type="hidden">`!).
     - Populate `Hero photograph` and `Your photo` dropdowns from **published** pieces (`loadManifest()`), not `loadStudio()` (which included drafts!).
   - In `app/desk/groups/page.tsx`:
     - Remove raw `"Image address"` URL text inputs (preserve existing `imageUrl` via `<input type="hidden">` so nothing breaks, while preventing Ajja from pasting broken external URLs). Replace `"Studio Study"` fallback on line 136 with `"Not named yet"`.
   - In `app/desk/settings/page.tsx`:
     - Remove the `"Use tidied photos as covers everywhere"` (`approveEnhancedCovers`) button so one accidental tap cannot overwrite every cover photo across the entire catalog!

6. **Stage 2 Gate:**
   - Update any E2E selectors in `e2e/shop.spec.ts` / `e2e/tap-targets.spec.ts` / `e2e/visual-audit.spec.ts` if a label changed (keep plain accessible names compatible wherever possible: `"Email"`, `"Password"`, `"Sign in"`, `"My pieces"`, `"Add a piece"`, `"Messages"`, `"Settings"`, `"Save piece"`, `"Show on site"`, `"Put on the site"`, `"Hide"`, `"Undo"`).
   - Run `pnpm lint && pnpm typecheck && pnpm test`.

---

### Stage 3 — Shared Public Frame, All-Width `Menu` Entrypoint, and Removal of Gimmicks

**User mandate:** *"menu entrypoint remains though"* + *"website does not handle sales only inquiries"*.

#### Files to touch
- `components/site-header.tsx`
- `components/site-footer.tsx`
- `components/shop/shop-providers.tsx`
- `components/shop/piece-card.tsx`
- `components/shop/piece-viewer.tsx`
- `components/shop/collectors-folio.tsx`
- `app/(shop)/p/[slug]/page.tsx`
- `app/layout.tsx`
- Delete obsolete gimmick components once zero imports remain:
  - `components/shop/currency-provider.tsx`
  - `components/shop/dynamic-price.tsx`
  - `components/shop/macro-loupe.tsx`
  - `components/shop/scale-visualizer.tsx`
  - `components/shop/dossier-modal.tsx`

#### Exact changes required
1. **All-width `Menu` entrypoint & zero dual-nav bug (`components/site-header.tsx`, `app/globals.css`):**
   - Previously `.mast-nav` hid at `900px` while `menu` used `lg:hidden` (`1024px`), causing BOTH navs to render at `901–1023px` and `Menu` to vanish on desktop (`>=1024px`).
   - Keep the **Menu** button visible at **every viewport width** (`inline-flex min-h-11 items-center justify-center border border-line-strong px-3.5 text-sm font-semibold`), alongside quiet direct links on wide screens (`hidden lg:flex` — single `1024px` breakpoint, delete the conflicting `@media (max-width: 900px) { .mast-nav { display: none; } }` rule) OR clean desktop header actions (`All pieces`, `Saved (n)` when `n > 0` or button, `Ask the studio`, and `Menu`).
   - Remove `<dialog className="... lg:hidden">` — remove `lg:hidden` from the Menu `<dialog>` so clicking **Menu** at `1440px` opens a crisp, architectural right-hand index drawer (`max-w-md ml-auto h-dvh`) on desktop and full-width sheet on mobile, with native `<dialog>` Escape + backdrop close + focus return to the **Menu** button!
   - Give the Menu link fallback (`href="/#index"` or `<noscript>` inline links) so navigation still works without JavaScript.
   - Only show `The studio` link when `hasStory` is true (pass `hasStory={Boolean(settings.story.trim())}` from `app/(home)/layout.tsx` and `app/(shop)/layout.tsx` to `SiteHeader` and `SiteFooter` so clicking `The studio` NEVER points to a missing `#studio` anchor!).

2. **Retire Atelier/Ecommerce Gimmicks cleanly:**
   - **No fake FX currency selector:** Prices are USD (`formatMoney(priceMinor, "USD")`) or `"Ask for the price"` when `null`. Remove `CurrencyProvider`, `CurrencySelector`, and `DynamicPrice`.
   - **No `MacroLoupeImage` hover gimmick & no `ScaleVisualizer` room-scale guesswork:** In `PieceViewer`, render the clean fit-contained studio `<Image>` directly inside a `<figure>` (`object-contain`, whole piece never cropped, 180ms `.photo-dissolve` when switching thumbnails) with a clear `"Full screen"` button (`aria-label="View full screen"`) that opens the native `<dialog>` full-screen viewer. Remove `MacroLoupeImage` and `ScaleVisualizer`.
   - **No `DossierModal` ("quick look" popup duplicating the piece page):** Clicking a piece card goes straight to `/p/[slug]`, and `Save` / `Saved` stays as a quiet secondary action if kept, or keep `FolioProvider` (`Saved pieces`) clean and USD-only (using `formatMoney` instead of `useCurrency`).
   - In `app/layout.tsx`: remove `scroll-smooth` and `data-scroll-behavior="smooth"` from `<html>` (per `DESIGN.md`: *"Native scroll — no scroll engine, no smooth-scroll hijack"*), remove unused `Courier_Prime` font import if no longer referenced, and set light/dark `themeColor` matching `#f3ede2` (light) and `#221b15` (dark) plus `viewportFit: "cover"`.

3. **Shared Footer honesty (`components/site-footer.tsx`):**
   - Remove duplicate `"Made by hand"` / `"made by hand in Collegeville"` repetition in `.foot-bot`.
   - Only link to `/#studio` when `hasStory` is true. Do not claim `"Studio visits by appointment"` unless `settings.story` or policies mention it — instead show verified `{settings.town}, {settings.region}` and `"Inquiries welcome — nothing is paid online."`

4. **Stage 3 Gate:**
   - Confirm zero remaining imports of deleted files (`currency-provider`, `dynamic-price`, `macro-loupe`, `scale-visualizer`, `dossier-modal`).
   - Run `pnpm lint && pnpm typecheck && pnpm test`.

---

### Stage 4 — Storefront Art Direction: *The Verandah Index* (Mangalorean + Konkani Craft Showcase)

**Aesthetic & Cultural Direction:**
Think of the shaded threshold (*sopaan* / verandah) of a Konkani coastal home in Mangaluru translated honestly for a family workshop in Collegeville, Pennsylvania: sun-washed limewash plaster, warm aged jackwood timber ink, thin overlapping Basel-mission terracotta/laterite rules, open breathing room around handmade woodwork, poured paintings, ceramics, and handwork, and typography that reads like an exhibition catalogue rather than a loud brutalist poster.

#### Palette & Typography Refinements (`app/globals.css`)
- **Palette tokens (`:root`):**
  - `--gesso: #f3ede2` (sun-washed limewash paper, warm but crisp, not muddy beige)
  - `--plate: #e6dccb` (raw clay/linen mounting plate behind fit-contained photographs)
  - `--plate-deep: #d8cbb6`
  - `--jackwood: #2c221b` (deep seasoned jackwood timber ink — primary text & primary CTA)
  - `--jackwood-soft: #635548` (secondary text, >= 5.2:1 contrast on `--gesso`)
  - `--laterite: #894636` (Mangalorean terracotta roof-tile clay — structural hairlines, active rule ticks, subtle hover warmth; NEVER splash as giant text walls)
  - `--laterite-deep: #6e3527`
  - `--cobalt: #28489c` (keyboard `:focus-visible` ring ONLY — never use cobalt for primary buttons!)
  - `--vat: #211913` (shaded verandah beam — footer & full-screen viewer ground)
- **Fix the #1 visual flaw in current typography:**
  - Right now `.disp`, `.display`, and `.display-wide` force `font-weight: 800; text-transform: uppercase; line-height: 0.92;` in Bricolage Grotesque — making `"THE MATERIAL INDEX."`, `"PAINTINGS"`, `"VISUAL AUDIT SPECIMEN"`, and `"ASK THE STUDIO"` shout in giant blocky all-caps!
  - **Change headings to composed mixed-case editorial hierarchy:**
    - Use **Newsreader** (`var(--font-reader)`) in **normal sentence/title case** (`text-transform: none`, `font-weight: 500`, `letter-spacing: -0.02em`, `line-height: 1.06`) for primary editorial headings (`.disp`, `.display`) so `"The material index"`, `"Paintings"`, `"Woodwork"`, and piece titles feel crafted, literary, and gallery-grade!
    - Use **Bricolage Grotesque** (`var(--font-display)`, `font-weight: 600`, sentence case) for navigation, buttons, category row numerals/counts, and fact table labels — clean, architectural, legible.
    - Keep `tabular-nums` (`.nums`) on all counts, dimensions, and USD prices.

#### Screen-by-Screen Composition
1. **Home (`app/(home)/page.tsx`, `components/shop/studio-intro.tsx`, `components/shop/acquisition-faq.tsx`, `components/shop/commission-form.tsx`):**
   - **Verandah Threshold Opening (`#index`):**
     - When at least one public piece has a photograph (`leadPiece` = hero setting matching a public piece, else first available photographed public piece): compose a calm 12-column opening above/beside the material index — left 6 columns: studio kicker (`megele.art — family studio in {town}, {region}`), mixed-case Newsreader `<h1>` (`settings.heroHeadline` if approved, or `"Handmade paintings, woodwork, and studio pieces."` / `"The material index"` — note: keep `e2e/shop.spec.ts` assertion in mind or update the test expectation in lockstep!), concise 2-sentence explanation that every piece is one-of-a-kind and inquired about directly, and direct anchor/link into the index; right 6 columns: the real whole studio photograph framed on `--plate` with a quiet caption linking to `/p/${leadPiece.slug}`! If zero public pieces exist yet, collapse gracefully to a clean typographic opening with no empty gray box.
     - Directly below (visible at the bottom of the first desktop viewport, separated by a double laterite/timber verandah rule): **Browse by craft / Material Index rows** (`Paintings`, `Woodwork`, `Ceramics`, `Handwork` — whatever categories actually have public pieces, plus `All pieces`). Each row has generous horizontal rhythm: craft name in Newsreader (`clamp(1.75rem, 3.2vw, 2.75rem)`), optional 1-line intro, tabular piece count, and a crisp `4:3` uncropped/well-framed real photograph (`160px–220px` wide on desktop; compact `16:10` thumbnail beside or above on mobile — NOT a 420px-tall image pushing every category off-screen on phones!). Omit any `"no photograph yet"` placeholder box when a category has no cover.
   - **From the Studio (`StudioIntro`):**
     - Fix portrait vs piece-detail separation: if `settings.ownerPhoto` is set, treat it strictly as a studio/family portrait (`alt="${settings.ownerName} in the studio"`, NO piece inventory number caption underneath!). Only show the piece reference caption when displaying `detail` (an actual studio piece).
   - **How Inquiry Works (`AcquisitionFaq`) & Send a Note (`#inquire` / `CommissionForm`):**
     - Remove the tilted postcard rotation (`transform: rotate(...)`) if present on `.note-card` — keep the form architectural, flat, ruled with a thin top laterite accent border (`border-top: 2px solid var(--laterite)`), generous `min-h-12` fields, clear USD/no-online-payment reassurance, and selected saved-piece chips rendered cleanly above the textarea without mutating the visitor's own paragraph unexpectedly.

2. **Category Page (`app/(shop)/category/[slug]/page.tsx`, `components/shop/piece-card.tsx`):**
   - Replace CSS multi-column masonry (`.wall { columns: 4 }` — which scrambles left-to-right reading/tab order and left huge vertical gaps in historical screenshots!) with a disciplined **2-to-3 column CSS Grid** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 items-start`), where each `PieceCard` frames the whole work inside a calm `--plate` mat (`aspect-[4/5]` with `object-contain p-3` or natural aspect ratio capped cleanly so tall narrow panels and wide tables sit harmoniously side by side in true reading order!).
   - Caption below each piece: Title (or `Untitled · No. xxxxxx` — clean sentence case, not lowercase `no. f8930a`), medium/art form, and `Ask for price` / `$180` / `Sold`.

3. **Piece Page (`app/(shop)/p/[slug]/page.tsx`, `components/shop/piece-viewer.tsx`, `components/enquiry-form.tsx`):**
   - Whole photograph on `--plate` ground (`md:col-span-7`), calm museum label on the right (`md:col-span-5`): availability dot + `"Available in the studio"` / `"Sold"`, mixed-case Newsreader `<h1>`, price (`$...` or `"Ask for the price"`), description, clean ruled facts list (Medium, Size, Condition, Studio location — only facts actually recorded!), primary button `"Ask about this piece"` in `--jackwood` (`btn-primary`, NOT loud cobalt blue!), and `"Share"`.
   - On mobile, ensure the sticky bottom `"Ask about this piece"` bar hides or does not overlap once `#enquire` is in view (or use clean static CTA + smooth jump to `#enquire` with proper `scroll-margin-top: 5rem`).

4. **Motion Discipline (`components/motion-scan.tsx`, `app/globals.css`):**
   - Never hide above-the-fold `<h1>`, hero image, or category index rows with `[data-reveal] { opacity: 0 }`! A page without JS or before `MotionScan` hydrates must show a 100% visible, complete first viewport! Either remove `MotionScan` / `[data-reveal]` opacity-0 hiding altogether (keeping only the 180ms `.photo-dissolve` on user thumbnail switches, which is cleaner, faster, zero-CLS, and 100% SSR-visible!) or scope subtle reveal strictly to progressive enhancement that never hides content when JS hasn't run. **Recommended:** Remove `[data-reveal]` opacity-0 hiding and `MotionScan` completely — let real photography and typography stand immediately on first paint!

5. **Stage 4 Gate:**
   - Update `e2e/shop.spec.ts` if heading copy changed (if keeping `"The material index"` in mixed case, `/material index/i` in `e2e/shop.spec.ts` ALREADY matches case-insensitively!).
   - Run `pnpm lint && pnpm typecheck && pnpm test`.

---

### Stage 5 — Dependency, Tracked File, and Documentation Cleanup

#### Files to touch
- `package.json` & `pnpm-lock.yaml`
- `ajja_atelier_archive_storefront.html` (delete via `git rm`)
- `public/{file,globe,next,vercel,window}.svg` (delete via `git rm` after grep confirms unused)
- `DESIGN.md`
- `HANDOFF.md`
- `.devin/agents/sidekick.md`

#### Exact steps
1. **Remove unused heavy runtime packages:**
   - Confirm via grep that `gsap`, `lenis`, and `lucide-react` have zero imports anywhere in `app/`, `components/`, `lib/`, `scripts/`, `tests/`, `e2e/`.
   - Run `pnpm remove gsap lenis lucide-react`.
2. **Remove tracked prototype & boilerplate files:**
   - Confirm zero references, then `git rm ajja_atelier_archive_storefront.html public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg`.
3. **Update docs to match reality (no stale mentions of WebGL ripples, Lenis, GSAP, or automatic OpenRouter cover overrides):**
   - Update `DESIGN.md` to document *The Verandah Index* (Newsreader mixed-case headings, Bricolage UI/labels, `--gesso`/`--plate`/`--jackwood`/`--laterite`, cobalt focus only, all-width Menu, whole-object framing, 20px/56px foolproof desk).
   - Update `HANDOFF.md` lines 81–84 (remove stale WebGL ripple mention; document isolated `E2E_*` test variables).
   - Update `.devin/agents/sidekick.md` line 16 (remove stale Lenis/GSAP note).
4. **Stage 5 Gate:**
   - Run `pnpm lint && pnpm typecheck && pnpm test`.

---

### Stage 6 — Full Launch Verification Gate

Do not declare the work complete until every check below is green and recorded:

1. **Static & Unit Suite:**
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```
2. **Production Build (`pnpm build`):**
   - Run `pnpm build` using an isolated Neon branch `DATABASE_URL` (read-only during build). Must exit `0` with zero TypeScript, CSP, or prerender errors.
3. **Isolated Playwright E2E + Accessibility (`axe-core`) + Tap Targets:**
   - Against an isolated Neon test branch (`E2E_ISOLATED=1`, `E2E_DATABASE_URL=<non-prod-neon-branch-url>`, `E2E_ADMIN_PATH=e2e-desk-secret-path`, `E2E_SESSION_SECRET=e2e-fixture-secret-32chars`):
     ```bash
     pnpm test:e2e
     ```
   - Verify:
     - Home, `/category/all`, `/policies`, `/privacy`, `/p/[slug]`, and `/desk` (404 when direct; sign-in + Today + Add + Pieces + Editor + Messages + Settings when accessed via `/{E2E_ADMIN_PATH}`) pass **zero axe accessibility violations**.
     - **Menu** button is visible and keyboard-operable (`Enter` opens, focus moves inside, `Escape` closes and returns focus) at `390px`, `768px`, `900px`, `901px`, `1024px`, and `1440px`, with **zero horizontal overflow** (`document.documentElement.scrollWidth <= window.innerWidth`).
     - Unnamed or photoless draft **cannot** be published via `publishPiece`, inline status dropdown, bulk publish, or cron.
     - Enquiry form saves to `enquiries` and shows confirmation even when `RESEND_API_KEY` is unset or unreachable.
     - Desk buttons/inputs meet height targets (`>= 44px` secondary, `>= 56px` primary controls) and **Help** is visible at `390px` mobile width.
4. **Visual Inspection of Fresh Screenshots (`390px` & `1440px`):**
   - Capture fresh screenshots into gitignored `screenshots/` and visually inspect home, category, piece, menu drawer, desk sign-in, desk Today, desk Add/About/Review, desk Pieces, and desk Messages in both light and dark modes before final sign-off.
5. **Final Git Cleanliness Check:**
   - `git status --short` must show a clean tree on `fix/verandah-index-launch` (with `seed/photos/`, `artifacts/`, `screenshots/`, and `.env*` cleanly ignored and untouched). Do **not** push to `main` until the user reviews and approves deployment.
