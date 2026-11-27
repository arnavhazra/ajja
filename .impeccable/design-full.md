# megele.art — Material Index

## Direction

The shop is a material index, not a wall of filters. The home page is a
numbered catalogue of art forms — each row is a real photograph, a name, and a
public piece count — leading to one page per art form. Piece pages keep the
photograph whole, fit-contained and never cropped, with a breadcrumb back to
the art form and one direct way to ask. The voice is a Mangalorean material
study: warm paper, thin ruled ink, archival ledger metadata, and colour left
chiefly to the pieces themselves.

## Colors

Canonical values live in `app/globals.css`; keep this section synchronized.

Light mode:

- `--gesso` `#f3ede2` — page ground, warm primed paper.
- `--surface-low` `#f9f3e8` — quiet raised paper surface.
- `--plate` `#e6dccb` / `--plate-deep` `#d8cbb6` — archival mats, panels,
  form wells, and desk surfaces.
- `--jackwood` `#2c221b` — ink text, ruled lines, and primary actions.
- `--jackwood-soft` `#635548` — captions and secondary text; keep contrast at
  or above 4.5:1 on its background.
- `--laterite` `#894636` / `--laterite-deep` `#6e3527` — house accent,
  links, active marks, and hover states.
- `--cobalt` `#28489c` — focus rings only.
- `--pigment` / `--pigment-ink` — per-piece accent and contrast-safe text,
  sampled and set inline by `lib/pigment.ts`.
- `--line` / `--line-strong` — translucent jackwood rules.
- `--vat`, `--vat-ink`, `--vat-soft` — footer and full-screen viewer.
- `--ok`, `--sold`, `--warn` — status only, never decoration.

Dark mode uses the same token names with the adapted values already declared
under `prefers-color-scheme: dark`; do not invent a second token system.
Legacy utility names (`--wall`, `--tar`, `--sap`, and their variants) alias
the material tokens so the desk and older components keep working.

## Typography

- Display, UI, navigation, controls, and headings: Bricolage Grotesque
  (`--font-display`), usually weight 600–800, tight but never beyond
  -0.04em tracking.
- Prose, artwork titles, captions, and editorial italics: Newsreader
  (`--font-reader`).
- Archival metadata, figure numbers, counts, reference codes, and
  micro-labels: Courier Prime (`--font-type`) through `.ledger` and
  `.micro-label`.
- Prices, counts, and measurements use tabular numerals (`.nums`).
- Keep the hierarchy restrained: one large display statement per view, then
  quiet ledger metadata and legible prose.

## Components

- **Material-index rows** (`.idx-*`): numbered full-width rows with a real
  cover photograph, art-form name, concise introduction, count, and a thin
  rule. Covers stack above text on phones.
- **Archival plates**: artwork sits inside a warm `--plate` mat with a 2px
  radius and a thin `--line` border. Images use `object-fit: contain`; never
  crop, mask, or apply decorative photographic effects.
- **Ledger strips**: small Courier Prime metadata rows using `REF.`,
  `FIG.`, counts, pigment dots, and bracketed status text. They are evidence,
  not decoration.
- **Buttons**: rectangular 2px-radius controls. Primary actions are jackwood
  on gesso; secondary actions use a thin strong border. Desk controls are
  larger, calmer, and use plain verbs.
- **The vat footer**: deep warm brown surface carrying pigment ribbons,
  studio facts, navigation, and correspondence details.
- **Piece viewer**: fit-contained plate, figure thumbnails with visible
  figure labels, and a native full-screen dialog. Do not replace it with a
  carousel that crops the work.
- **Desk primitives**: `.desk-note`, `.desk-choice`, `.desk-chip`,
  `.desk-fold`, and `.desk-photo-picker` follow the same tokens but favor
  clarity, permanent labels, and large native controls.

## Layout

- Home: a concise masthead, editorial hero with a real artwork plate, then
  the numbered material index. Some artwork or index material should already
  be visible in the first mobile viewport.
- Category pages: art-form name, introduction, count, then pieces at their
  real proportions, available before sold.
- Piece pages: breadcrumb, large fit-contained photograph, only recorded
  facts, one direct enquiry path, and related monograph selections.
- Use ruled separations and asymmetric editorial grids rather than generic
  equal cards. Avoid nested cards.
- Tap targets stay at least 44px. Visible cobalt focus rings everywhere.

## Motion

- Native scroll — no scroll engine or smooth-scroll hijack.
- One sanctioned artwork motion: a 180ms opacity dissolve when the selected
  photograph changes (`.photo-dissolve`). Entry reveals are a restrained 12px
  rise.
- `prefers-reduced-motion: reduce` makes every transition instant and leaves
  content visible.

## Desk

Same tokens, calmer. Minimum 20px body text, 1.5 line height, 56px controls,
3px cobalt focus, single-column task flow, permanent labels, native buttons
and radios. Listing a piece is a resumable three-stage flow — Photo, About,
Review — and “Show on site” is the only publish action inside it. Use plain
words: Photos, Price, Hide, Mark as sold.

## Content honesty

Only real photographs from the studio. No invented titles, prices, sizes,
testimonials, hours, simulated carvings, translations, or stock imagery.
Empty price stays empty and the piece is asked about directly.
