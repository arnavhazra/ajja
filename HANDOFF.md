# Ajja handoff

Shop for a family studio in Collegeville, Pennsylvania. People enquire first. The site does not take payment. Currency is USD. Names, prices, phone, email, hours, and the street stay empty until he types them.

Commands live in `AGENTS.md`. Values live in `.env.local`, which is never committed. This file lists variable names only.

## Environment names

Shop:

- `DATABASE_URL`
- `BLOB_READ_WRITE_TOKEN`
- `ADMIN_PATH`
- `SESSION_SECRET`
- `CRON_SECRET`

Owner sign-in, still waiting:

- `OWNER_EMAIL` (present, empty)
- `RESEND_API_KEY` (not in `.env.local` yet)
- `EMAIL_FROM` (not in `.env.local` yet)

Staff door, local setup:

- `DEV_ADMIN_EMAIL`
- `DEV_ADMIN_PASSWORD`
- `DEV_ADMIN_TOTP_SECRET`

Photo tidy-up (image-to-image studio sweep):

- `OPENROUTER_API_KEY`

Neon companions already pulled beside `DATABASE_URL`:

- `DATABASE_URL_UNPOOLED`
- `NEON_PROJECT_ID`
- `PGDATABASE`
- `PGHOST`
- `PGHOST_UNPOOLED`
- `PGPASSWORD`
- `PGUSER`
- `POSTGRES_DATABASE`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_URL_NO_SSL`
- `POSTGRES_USER`

Also pulled with the Vercel link: `VERCEL_OIDC_TOKEN`.

Optional seed override: `SEED_DIR`.

## Seed

`pnpm seed` runs `node scripts/seed.mjs`. It reads `SEED_DIR`, then `seed/photos`, then `/Users/arnavhazra/Downloads/ajja-art-site-assets`. It strips photo metadata, uploads WebP files to Blob, and creates drafts.

39 poured-painting photographs are in as drafts. Titles and prices are empty, on purpose. Drafts stay off the shop.

Categories Paintings, Woodwork, and Handwork are labels he can rename. The photographs are not assigned to those categories.

## Desk

The desk is the exact `ADMIN_PATH` (no leading slash in the variable), rewritten onto `app/desk`. A direct visit to `/desk` is the public 404.

Main sign-in is email + password, checked against `admin_users.password_hash` (scrypt). Five wrong tries lock that account for 15 minutes. Change the password at the desk screen **Account**.

Create an account or reset a password from a terminal with the production `DATABASE_URL` in the environment:

```
pnpm admin:password owner@example.com
```

It prints a new random password once. Set `NEW_ADMIN_PASSWORD` to choose one instead. The columns come from `drizzle/0002_admin_password.sql`.

Other doors, linked under the form: **Email me a code** (`?code=1`) waits on `OWNER_EMAIL`, `RESEND_API_KEY`, and `EMAIL_FROM`. **Staff with app code** (`?staff=1`) asks for `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`, and a TOTP code from `DEV_ADMIN_TOTP_SECRET`.

Cheat sheet: the secret desk path plus `/help/print` (`app/desk/help/print/page.tsx`).

The hero headline in settings is “Paintings, woodwork, and pieces made by hand.” The desk keeps `copyNeedsApproval` and shows “Needs your approval.” That line is on the desk. The public site does not show it.

The home hero photograph is a priority `<Image>`; the WebGL ripple loads on top only for fine pointers without reduced motion. See `DESIGN.md`.

## Backups

Desk screen **Bring in / Save a copy** (`app/desk/files/page.tsx`). **Save a copy** calls `GET /api/desk/backup`, downloads `ajja-backup.zip` (words plus photographs), and sets `lastBackupAt`.

Cron is `GET /api/cron/publish`, daily (`0 13 * * *` in `vercel.json`). The request must send `Authorization: Bearer` plus `CRON_SECRET`. The job publishes scheduled pieces, deletes enquiries older than the retention setting (365 days unless that setting changes), and hard-deletes trash older than 30 days, including their Blob files.

## Google Business Profile

Fill only what is already true.

- Name: Ajja
- Place: Collegeville, Pennsylvania, United States
- Website: the public shop
- What people do: send an enquiry. Payment is arranged off the site.
- Map on the site: the town search, `https://maps.google.com/?q=Collegeville%2C%20Pennsylvania`

Leave these open until he supplies them:

- Phone
- Email
- Hours
- Street

The Visit page already says the street and the hours are not listed yet. Do not invent them on the profile.

## Sign-in recovery

The desk has a password door and an email-code door. If the owner forgets the
password: visit `/{ADMIN_PATH}?code=1`, enter the `OWNER_EMAIL` address from the
env, and a one-time code is emailed to it. That door only appears when
`OWNER_EMAIL` is set (it is, in `.env.local` / Vercel env). There is no
password-reset email — the code door is the recovery path.
