# Ajja — Directory & Architecture Overview

Comprehensive reference for the directory structure, technical architecture, design conventions, and operational workflows of **Ajja**.

---

## 1. Executive Summary

**Ajja** is a bespoke art showcase and private administrative desk ("Desk") created for an artist family studio located in Collegeville, Pennsylvania. The platform presents original poured paintings, fine woodwork, and handcrafted art objects.

Unlike conventional e-commerce storefronts that emphasize instant checkout and carts, Ajja is intentionally **enquiry-first**. Visitors explore available works, save selections to a private list, and initiate direct conversations with the family studio via an enquiry form or WhatsApp. Prices are honest and transparent; pieces without assigned prices remain open for discussion rather than showing placeholder figures.

### Core Tech Stack

| Technology | Role |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server Components by default, `use cache`, partial prefetching, Turbopack) |
| **Language** | TypeScript (Strict mode, zero `any`, named exports) |
| **Database** | Neon Postgres (Serverless Postgres via `@neondatabase/serverless`) |
| **ORM & Migrations** | Drizzle ORM (`drizzle-orm` neon-http driver, `drizzle-kit`) |
| **File Storage** | Vercel Blob (`@vercel/blob` for direct client upload of WebP artwork photographs) |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/turbopack`, CSS design tokens in `app/globals.css`) |
| **Validation** | Zod 4 (`zod` schemas for all server inputs and desk forms) |
| **Testing** | Vitest (unit tests) & Playwright with `@axe-core/playwright` (E2E & accessibility tests) |
| **Image Processing** | Sharp (`sharp` for EXIF stripping, metadata extraction, and WebP transcoding) |
| **Typography** | `next/font/google` loading Spectral (primary serif), Newsreader (alternate serif), and Source Sans 3 (body sans) |

---

## 2. Directory Map

```
ajja/
├── .cursor/rules/             # Workspace rules (project standards, design, admin safety, quality)
├── .agents/skills/            # Agent skills and visual engineering guidelines
├── app/                       # Next.js App Router root
│   ├── (shop)/                # Public storefront & studio routes (grouped)
│   │   ├── about/             # Studio story & artist background
│   │   ├── c/[slug]/          # Category view (Paintings, Woodwork, Handwork)
│   │   ├── p/[slug]/          # Product detail page & dynamic OpenGraph card
│   │   ├── policies/          # Studio buying, collection, and return policies
│   │   ├── privacy/           # Privacy policy
│   │   ├── saved/             # Bookmarked / saved pieces (client-persisted)
│   │   ├── search/            # Instant search by title, description, or tag
│   │   ├── shop/              # Main catalog grid with filter controls
│   │   ├── sold/              # Historical archive of sold works
│   │   ├── studio/            # Studio editorial story and collection subpages
│   │   ├── visit/             # Studio visit, location (Collegeville, PA), directions
│   │   ├── layout.tsx         # Storefront layout (Header, Footer, Main container)
│   │   └── page.tsx           # Home page (Hero, Curated works, Category teasers)
│   ├── api/                   # Server API routes
│   │   ├── cron/publish/      # Daily cron job (scheduled publish, retention cleanup)
│   │   ├── desk/backup/       # Full zip backup generation (DB records + Blob photos)
│   │   ├── desk/export/       # Catalog export (CSV / JSON)
│   │   ├── desk/messages/     # Enquiry message export
│   │   ├── desk/upload-token/ # Authenticated Vercel Blob client upload token
│   │   ├── events/            # Privacy-safe client analytics event beacon
│   │   └── saved/             # Batch product resolver for saved items
│   ├── desk/                  # Private administrative desk (reached via secret rewrite)
│   │   ├── add/               # Quick creation of a new art piece
│   │   ├── files/             # Backup download & data import screen
│   │   ├── groups/            # Category & collection management
│   │   ├── help/              # Desk user manual & printable cheat sheet
│   │   ├── history/           # Audit logs and product version diffs
│   │   ├── home/              # Administrative overview, tasks, and approval alerts
│   │   ├── insights/          # Privacy-friendly traffic, views, and search terms
│   │   ├── messages/          # Customer enquiries inbox & status manager
│   │   ├── pieces/            # Full inventory management & piece editor
│   │   ├── poster/            # Printable studio QR poster generator
│   │   ├── review/            # Review panel for draft copy & unapproved changes
│   │   ├── desk.css           # Administrative interface styles
│   │   ├── layout.tsx         # Desk authenticated shell, navigation, flash notices
│   │   └── page.tsx           # Desk entrance (Email OTP login & Staff door)
│   ├── missing/               # Public 404 decoy page for direct /desk access
│   ├── apple-icon.tsx         # Dynamic Apple touch icon
│   ├── globals.css            # Tailwind v4 import & CSS custom property design tokens
│   ├── icon.tsx               # Dynamic browser favicon
│   ├── layout.tsx             # Root document layout with fonts & theme initializers
│   ├── manifest.ts            # Dynamic Web App Manifest
│   ├── not-found.tsx          # Storefront 404 handler
│   ├── opengraph-image.tsx    # Site-wide default OpenGraph social image
│   ├── robots.ts              # Search engine robots.txt configuration
│   └── sitemap.ts             # Dynamic sitemap index for published pieces
├── components/                # Shared React components
│   ├── desk/                  # Desk-specific components (Nav, Upload, Flash, Drag)
│   ├── contact-actions.tsx    # Direct contact triggers (WhatsApp, Phone, Email)
│   ├── enquiry-form.tsx       # Zod-validated piece enquiry dialog & form
│   ├── event-beacon.tsx       # Client-side viewing analytics ping
│   ├── filters.tsx            # Category, status, and price sort controls
│   ├── gallery.tsx            # Lightbox gallery with focal point positioning
│   ├── json-ld.tsx            # Schema.org structured data (Product, Organization)
│   ├── not-found-view.tsx     # Custom 404 view presentation
│   ├── product-card.tsx       # Standard artwork card with image, price, and status
│   ├── saved-list.tsx         # Client list of saved artworks
│   ├── share-save.tsx         # Share modal / copy link and bookmark buttons
│   ├── site-footer.tsx        # Storefront footer with studio location & links
│   ├── site-header.tsx        # Storefront header with navigation & text controls
│   ├── text-controls.tsx      # Font size & high contrast preference toggles
│   └── tracked-link.tsx       # Navigation link that emits analytics events
├── drizzle/                   # Database migrations
│   └── 0001_init.sql          # Initial schema applied to Neon Postgres
├── e2e/                       # End-to-end integration tests
│   └── shop.spec.ts           # Playwright tests for customer journey & accessibility
├── lib/                       # Business logic, database queries, and utilities
│   ├── db/                    # Drizzle ORM client & table schema definitions
│   ├── auth.ts                # Session management, cookie signing, email OTP, staff TOTP
│   ├── cn.ts                  # Tailwind class merge helper (`clsx` + `tailwind-merge`)
│   ├── contrast.ts            # WCAG color contrast validation math
│   ├── csv.ts                 # CSV parsing and serialization for catalog data
│   ├── day-hash.ts            # Salted daily client hashing for privacy-safe analytics
│   ├── desk-actions.ts        # Server actions for piece CRUD, status, and settings
│   ├── desk-data.ts           # Server queries for desk screens (pieces, metrics, logs)
│   ├── desk-path.ts           # URL path builder respecting secret admin prefix
│   ├── env.ts                 # Environment variable validation and accessors
│   ├── hero-lcp.ts            # Hero image metadata resolver for Largest Contentful Paint
│   ├── hero-src.ts            # Server-side hero image loader with Sharp dimensions
│   ├── home-html.mjs          # Raw HTML optimizer for homepage LCP budget
│   ├── images.ts              # WebP conversion, dimension probing, and focal point math
│   ├── missing.ts             # Decoy route rewrite helpers
│   ├── money.ts               # Integer cents conversion, formatting, and USD strings
│   ├── open-now.ts            # Studio operating hours and open/closed evaluation
│   ├── public-actions.ts      # Server actions for enquiries and public events
│   ├── public-data.ts         # Cached database queries for public shop (`use cache`)
│   ├── rate-limit.ts          # Postgres-backed rate limiting for forms and auth
│   ├── schemas.ts             # Zod validation schemas for pieces, enquiries, settings
│   ├── settings.ts            # Studio configuration, copy approval state, themes
│   ├── shop-query.ts          # Search filter and sorting query builder
│   ├── site-url.ts            # Base site URL resolution helper
│   ├── slug.ts                # Slug normalization and redirects tracker
│   ├── status.ts              # Product status definitions (draft, published, sold)
│   ├── time.ts                # Date formatting and relative time calculations
│   ├── totp.ts                # RFC 6238 TOTP verification for staff fallback login
│   ├── types.ts               # Shared domain TypeScript types
│   └── whatsapp.ts            # Pre-filled WhatsApp message generation
├── public/                    # Static assets & SVG icons
├── scripts/                   # CLI maintenance & build scripts
│   ├── hero-lcp.mjs           # Pre-build hero image delivery analyzer
│   ├── home-lcp-html.mjs      # Post-build homepage HTML delivery optimizer
│   └── seed.mjs               # Artwork ingest script (Sharp WebP conversion + Blob upload)
├── tests/                     # Unit test suites (Vitest)
│   ├── catalog.test.ts        # Catalog query and filter behavior
│   ├── contrast.test.ts       # WCAG AAA/AA color contrast verification
│   ├── day-hash.test.ts       # Privacy day-hash stability tests
│   ├── enquiry.test.ts        # Enquiry submission and validation tests
│   ├── money.test.ts          # Money formatting and integer cents logic
│   ├── shop-query.test.ts     # Search and filter parameter parsing
│   ├── totp.test.ts           # Staff TOTP token validation
│   └── whatsapp.test.ts       # WhatsApp deep link builder tests
├── CHANGELOG.md               # Version history and feature releases
├── DESIGN.md                  # Visual guidelines, color tokens, typography, motion philosophy
├── HANDOFF.md                 # Studio handoff documentation, secrets reference, Google Profile
├── AGENTS.md                  # Operational guide, development commands, agent rules
├── eslint.config.mjs          # ESLint flat config
├── next.config.ts             # Next.js 16 configuration (CSP headers, Turbopack, remote images)
├── package.json               # Dependencies, scripts, and package manager configuration
├── playwright.config.ts       # Playwright browser testing configuration
├── proxy.ts                   # Edge/middleware proxy (LCP optimization & admin route rewrite)
├── tsconfig.json              # TypeScript compiler configuration with `@/*` paths
├── vercel.json                # Vercel deployment settings and daily cron job definition
└── vitest.config.ts           # Vitest configuration for unit test suite
```

---

## 3. High-Level Architecture & Folder Organization

### `app/(shop)` — Public Storefront & Studio Routes

All public routes reside in the `(shop)` route group, sharing a common layout that renders the header, main content, and footer.

- **`app/(shop)/page.tsx`**: Studio homepage. Features a fast-painting home hero image, introductory studio copy, featured artworks, category discovery banners, and direct contact options.
- **`app/(shop)/shop/page.tsx`**: Browse catalog. Provides a responsive grid of available pieces with live category filters, price sorting, and instant search.
- **`app/(shop)/p/[slug]/page.tsx`**: Single piece detail view. Renders high-resolution photographs with focal point alignment, dimensions, medium, condition notes, integer-cents pricing, enquire button, WhatsApp link, and Schema.org Product JSON-LD.
- **`app/(shop)/c/[slug]/page.tsx`**: Category storefront (e.g., Paintings, Woodwork, Handwork). Displays pieces belonging to a specific studio discipline.
- **`app/(shop)/studio/page.tsx` & `studio/[slug]/page.tsx`**: Studio overview and editorial collections, highlighting the studio's craft philosophy and process.
- **`app/(shop)/saved/page.tsx`**: Personal saved list. Art pieces bookmarked by the user (stored in `localStorage` and resolved via `/api/saved`).
- **`app/(shop)/search/page.tsx`**: Dedicated search experience matching piece titles, descriptions, and materials.
- **`app/(shop)/sold/page.tsx`**: Archive of past works that have found homes, maintaining an artistic record.
- **`app/(shop)/visit/page.tsx`**: Studio visiting information for Collegeville, Pennsylvania, including location map links and visiting guidelines.
- **`app/(shop)/about/page.tsx`**: Background narrative on the studio founders, artistic techniques, and history.
- **`app/(shop)/policies/page.tsx` & `privacy/page.tsx`**: Honest, plain-language buying policies, studio pickup instructions, and privacy assurances.

### `app/desk` — Private Administrative Desk

The "Desk" is the administrative back-office where the studio owner manages pieces, uploads photos, reviews messages, and configures the shop.

- **Security Model**: The desk cannot be reached via direct navigation to `/desk`. Visiting `/desk` directly is rewritten by `proxy.ts` to `/missing` (a decoy 404). Access is granted only by browsing through the secret `ADMIN_PATH` environment variable (e.g., `/my-secret-desk`).
- **Authentication**:
  - **Owner Sign-in**: Passwordless 6-digit email code sent via Resend (`requestCode` / `verifyCode`).
  - **Staff Door**: Emergency access via `?staff=1` using `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`, and an RFC 6238 TOTP authenticator code (`DEV_ADMIN_TOTP_SECRET`).
- **Desk Routes**:
  - `home/`: Administrative dashboard displaying draft counts, pieces needing pricing, copy pending approval, and quick actions.
  - `pieces/` & `pieces/[id]/`: Full inventory management. Controls title, slug, price, compare price, dimensions, category, status (`draft`, `scheduled`, `published`, `sold`, `hidden`), focal point adjustment (`focalX`, `focalY`), and image reordering.
  - `add/`: Single-step artwork creation workflow.
  - `messages/`: Customer enquiries inbox with status tracking (`new`, `replied`, `archived`) and contact information.
  - `groups/`: Category names, introduction copy, and collection curations.
  - `files/`: Backup generator ("Save a copy") creating `ajja-backup.zip` containing all database records and images, plus JSON import tools.
  - `history/`: Full audit trail recording all administrative changes and rollback snapshots.
  - `insights/`: Privacy-safe metrics detailing piece view counts, search queries, and engagement without storing personal IP addresses.
  - `poster/`: Generates a printable studio QR poster for visitors in the Collegeville studio to scan and view pieces on their phones.
  - `review/`: Staging review board highlighting unconfirmed copy or inventory items that require owner sign-off.
  - `help/` & `help/print/`: Plain-language guide and printable quick-reference sheet for studio owners.

### `app/api` — Server API Endpoints

- **`api/saved/route.ts`**: Receives an array of UUIDs from the visitor's browser `localStorage` and returns current product titles, thumbnails, prices, and availability status.
- **`api/events/route.ts`**: High-throughput beacon for capturing anonymous product views and search phrases using salted daily hashes (`dayHash`).
- **`api/cron/publish/route.ts`**: Scheduled maintenance executed daily via Vercel Cron. Publishes scheduled pieces, removes soft-deleted trash older than 30 days (along with Blob assets), and purges aged enquiry records.
- **`api/desk/upload-token/route.ts`**: Generates pre-signed client upload tokens for direct-to-Vercel Blob asset transfers, verifying desk session authorization prior to issuance.
- **`api/desk/backup/route.ts`**: Streams a full `.zip` archive containing database tables serialized to JSON and raw photograph files fetched from Blob storage.
- **`api/desk/export/route.ts`**: Generates downloadable CSV/JSON exports of the inventory catalog.
- **`api/desk/messages/route.ts`**: Handles enquiry bulk exports and status transitions.

### `components/` — UI Component Library

All components adhere to the project's strict design tokens:
- **Storefront Components**:
  - `site-header.tsx`: Responsive navigation bar with section links, search trigger, saved piece count badge, and text-size/theme controls.
  - `site-footer.tsx`: Studio location, opening information, policy links, and copyright notice.
  - `gallery.tsx`: Accessible image viewer with 4:5 image cropping, focal point centering, and modal lightbox preview.
  - `product-card.tsx`: Display card for artwork grids featuring image, title, formatted price, and status labels.
  - `filters.tsx`: Interactive filter controls for filtering by category, availability, and sorting by price or date.
  - `enquiry-form.tsx`: Customer modal form with Zod schema validation, gift note options, quantity selector, and honeypot protection.
  - `contact-actions.tsx`: Renders direct communication buttons (WhatsApp conversation launcher, phone, email).
  - `share-save.tsx`: Web Share API button (with clipboard fallback) and persistent save toggle.
  - `text-controls.tsx`: Accessibility tool for toggling enlarged body text and switching between theme palettes.
  - `json-ld.tsx`: Embeds rich Schema.org JSON-LD data for search crawlers.
  - `tracked-link.tsx` & `event-beacon.tsx`: Lightweight analytics instrumentation.
- **Desk Components (`components/desk/`)**:
  - `nav.tsx`: Administrative header with links to inventory, inbox, groups, backup, insights, and sign-out.
  - `flash.tsx`: Non-blocking feedback banners for completed actions.
  - `upload.tsx`: Drag-and-drop file uploader with direct upload to Vercel Blob.
  - `drag-photo.tsx`: Touch-friendly image reordering component.
  - `print-button.tsx`: Print trigger for cheat sheets and posters.
  - `import-file.tsx`: Desk file selector for importing backups.

### `lib/` — Business Logic, Database & Utilities

- **`lib/db/`**:
  - `schema.ts`: Drizzle schema definition. Tables: `products`, `product_images`, `categories`, `collections`, `collection_products`, `enquiries`, `events`, `site_settings`, `page_sections`, `testimonials`, `admin_users`, `login_codes`, `sessions`, `product_versions`, `audit_log`, `rate_limits`, `redirects`.
  - `index.ts`: Database client pooling using `@neondatabase/serverless` and Drizzle's `neon-http` driver.
- **`lib/auth.ts`**: Secure authentication routines. Issues and verifies `ajja_session` HTTP-only cookies, computes salted SHA-256 hashes for login codes, handles Resend email delivery, and enforces desk session requirements.
- **`lib/money.ts`**: Currency math. Converts strings to integer cents (`dollarsToMinor`), converts cents to decimal strings (`minorToDollars`), and formats USD values (`formatMoney`).
- **`lib/whatsapp.ts`**: Formats customer enquiries into friendly, pre-filled WhatsApp conversation links (`https://wa.me/...`).
- **`lib/images.ts`**: Utilities for parsing image dimensions, computing focal points, and preparing upload metadata.
- **`lib/public-data.ts`**: Public data fetching queries wrapped in Next.js 16 `"use cache"` with cache tags (`products`, `categories`, `settings`) for immediate cache invalidation.
- **`lib/public-actions.ts`**: Public server actions for handling customer enquiries and logging analytics.
- **`lib/desk-data.ts` & `lib/desk-actions.ts`**: Secure desk data fetchers and mutations. Validates desk sessions on every call, records audit log entries, creates version snapshots for rollbacks, and writes redirects when slugs change.
- **`lib/settings.ts`**: Default site configurations, studio address, copy approval states, theme presets, and FAQ items.
- **`lib/rate-limit.ts`**: Postgres-backed sliding-window rate limiter protecting login requests and enquiry submissions.
- **`lib/slug.ts`**: URL slug generator with duplicate resolution and automatic redirect tracking.
- **`lib/contrast.ts`**: Color contrast calculation enforcing WCAG standards.
- **`lib/hero-lcp.ts`, `lib/hero-src.ts`, `lib/home-html.mjs`**: Specialized Largest Contentful Paint (LCP) pipeline. Serves the primary hero image directly without image optimizer delays to guarantee sub-second rendering.

### `drizzle/` — Database Migrations

- **`0001_init.sql`**: Complete PostgreSQL schema applied to Neon. Defines tables, foreign keys, default UUID generators, and indexing on product statuses and slugs.

### `scripts/` — Build & Maintenance Tools

- **`scripts/seed.mjs`**: Artwork ingestion pipeline (`pnpm seed`). Reads local photo assets from `SEED_DIR` or asset directories, strips metadata using Sharp, converts images to WebP, uploads them to Vercel Blob, and creates unpriced draft pieces in Neon Postgres.
- **`scripts/hero-lcp.mjs`**: Pre-build script that inspects the active hero artwork and outputs `lib/lcp-manifest.json` for fast browser delivery.
- **`scripts/home-lcp-html.mjs`**: Post-build script that patches static HTML delivery to preserve LCP timing.

### `tests/` & `e2e/` — Verification Suites

- **Unit Tests (`tests/`)**:
  - `contrast.test.ts`: Asserts WCAG AA/AAA color contrast ratios across all theme palettes.
  - `money.test.ts`: Validates integer cents parsing, null handling, and currency formatting.
  - `whatsapp.test.ts`: Verifies pre-filled message encoding and telephone sanitization.
  - `totp.test.ts`: Confirms RFC 6238 TOTP computation against standard test vectors.
  - `enquiry.test.ts`: Verifies Zod validation for customer message submissions.
  - `catalog.test.ts`: Tests public catalog querying and sorting logic.
  - `day-hash.test.ts`: Validates deterministic daily visitor hashing.
  - `shop-query.test.ts`: Validates search parameter parsing and query string assembly.
- **E2E Tests (`e2e/`)**:
  - `shop.spec.ts`: Playwright suite testing storefront browsing, filter interactions, product detail views, saved lists, and automated accessibility checks via `@axe-core/playwright`.

---

## 4. Key Files and Specific Responsibilities

| File Path | Responsibility |
| :--- | :--- |
| **`proxy.ts`** | Request routing middleware. Intercepts `/desk` traffic to return decoy 404s, rewrites secret `ADMIN_PATH` requests to `/desk`, and injects security headers (`X-Robots-Tag: noindex`). |
| **`next.config.ts`** | Next.js configuration. Sets strict Content Security Policy (CSP), HSTS, frame-ancestors restrictions, Turbopack rules, and remote image patterns for Vercel Blob. |
| **`app/globals.css`** | Defines Tailwind v4 tokens and theme custom properties (`--paper`, `--ink`, `--line`, `--accent`, `--sold`, `--shadow`) across Walnut, Clay, Ink, and High Contrast palettes. |
| **`app/layout.tsx`** | Root layout. Instantiates Google Fonts (Spectral, Newsreader, Source Sans 3) with CSS variables and applies default theme attributes to the `<html>` element. |
| **`lib/db/schema.ts`** | Authoritative Drizzle ORM database schema specifying all relational tables, types, and constraints. |
| **`lib/auth.ts`** | Core desk security module managing email OTP codes, TOTP validation, session lifecycle, and audit logs. |
| **`lib/money.ts`** | Strict monetary formatting utility ensuring money is always processed as integer cents. |
| **`lib/desk-actions.ts`** | Primary administrative controller handling piece creation, updates, trashing, publishing, and settings mutations. |
| **`lib/public-data.ts`** | Read queries for public shop pages using Next.js 16 `"use cache"` and tag-based revalidation (`updateTag`). |
| **`vercel.json`** | Production deployment configuration and schedule for the daily publishing cron job (`GET /api/cron/publish`). |
| **`DESIGN.md`** | Comprehensive visual system specifications: the "Studio wall" aesthetic, typography choices, and motion restraints. |
| **`AGENTS.md`** | Developer instructions, CLI commands, project conventions, and Next.js 16 agent rules. |
| **`HANDOFF.md`** | Studio operational context, environment variable dictionary, backup protocols, and Google Business Profile guidelines. |

---

## 5. Architectural Conventions & Guidelines

### 1. Code Standards & TypeScript
- **TypeScript Strict**: No `any` types are permitted.
- **Exports**: Named exports are used everywhere except Next.js special files (pages, layouts, route handlers).
- **Naming**: Files and directories follow `kebab-case`.
- **Classes**: Always use the `cn(...)` utility (`lib/cn.ts`) to merge Tailwind utility classes.
- **Validation**: All user and server action inputs are parsed with Zod schemas before database insertion.

### 2. Rendering & Caching Model
- **Server Components First**: All components default to React Server Components. Client components (`"use client"`) are reserved strictly for interactive leaves (galleries, filters, forms, header dropdowns).
- **Public Reads**: Public queries utilize `"use cache"` with cache tags. Desk modifications trigger instant invalidation via `updateTag`.
- **LCP Budget**: The home hero uses direct image tags and optimized pre-computed dimensions to bypass Next.js image optimizer cold-starts, meeting strict Largest Contentful Paint budgets.

### 3. Desk Security & Safety
- **Dual Layer Authorization**: Relying solely on the secret proxy rewrite is forbidden. Every server action and data query in the desk calls `requireSession()` internally.
- **Audit Logging**: Every administrative modification writes an immutable record to the `audit_log` table.
- **Undo over Confirmation**: The desk favors immediate actions with undo capabilities over disruptive confirmation prompts. Soft-deleted items remain in the trash for 30 days before permanent deletion.
- **Stealth**: No links to the secret desk path exist on the public storefront. Direct requests to `/desk` render the `/missing` decoy 404.

### 4. Visual Identity ("Studio Wall")
- **Palette**: Limewash plaster and walnut ink. Built on CSS custom properties without hardcoded hex values in component markup.
- **Typography**: Spectral (printed, sharp serif) for headlines, Source Sans 3 (humanist sans) for body text at a minimum of 18px, and tabular numbers for pricing.
- **Restraint**: A single sap-green accent (`--accent`) is reserved exclusively for primary actions. No purple gradients, generic component library drops, or template cards.
- **Motion**: Minimal and natural. Hero artwork uses a single 280ms CSS fade-in, automatically disabled when `prefers-reduced-motion` is enabled. No parallax, scroll-jacking, or auto-playing elements.

### 5. Content Honesty & Data Integrity
- **No Inventions**: Never display placeholder text, fake testimonials, artificial countdowns, or unverified contact details.
- **Unpriced Pieces**: An unassigned price remains `null` and displays as an invitation to enquire, rather than defaulting to "$0.00".
- **Draft Isolation**: Draft artworks are strictly excluded from all public storefront queries and sitemaps until explicitly published.
