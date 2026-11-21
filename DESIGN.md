# megele.art — Material Index

## Direction

The shop is a material index, not a wall of filters. The home page is a
numbered list of art forms — each row is a real photograph, a name, and a
public piece count — leading to one page per art form. The piece page keeps
the photograph whole (fit-contained, never cropped) with a breadcrumb back to
its art form and a single way to ask. It reads as a Mangalorean material
study: warm paper, ink ruled thin, colour left to the pieces themselves.

## Palette

Defined in `app/globals.css`.

- `--gesso` `#f6f0e5` — page ground, warm primed paper.
- `--plate` `#e6dac7` / `--plate-deep` — panels and form wells.
- `--jackwood` `#30261e` — ink text and primary buttons.
- `--jackwood-soft` — captions and secondary text (kept ≥ 4.5:1 on gesso).
- `--laterite` `#894636` — house accent and hover state.
- `--cobalt` `#28489c` — focus rings only.
- `--pigment` / `--pigment-ink` — per-piece accent and its contrast-safe text
  colour, set inline from the sampled pigment (`lib/pigment.ts`).
- `--ok`, `--sold`, `--warn` — status only.
- `--vat` — footer and full-screen viewer.

Legacy names (`--wall`, `--tar`, `--sap`, …) alias the material tokens so the
desk and older components keep working.

## Typography

- Display and UI: Bricolage Grotesque (`--font-display`), heavy and tightly
  tracked for headlines (`.disp`, `.display`, `.word`).
- Prose and captions: Newsreader (`--font-reader`), italic for captions
  (`.caption`, `.tag`, `.kicker`, `.type`, `.prose`).
- Prices and counts use tabular numbers (`.nums`).

## Layout

- Home: the material index — a short masthead line, then numbered full-width
  category rows (`01 Paintings — 12 pieces`) with a cover photograph. The
  first row is visible without scrolling; covers stack above the text on
  phones. Empty groups are omitted; an "All pieces" row keeps uncategorised
  work reachable.
- Category page: name, intro, count, then the pieces at their real
  proportions, available before sold.
- Piece page: breadcrumb to its art form, large fit-contained photograph,
  facts only where recorded, one enquiry action.
- Tap targets at least 44px. Visible cobalt focus rings everywhere.

## Motion

- Native scroll — no scroll engine, no smooth-scroll hijack.
- One sanctioned motion: a 180ms opacity dissolve when the selected
  photograph changes (`.photo-dissolve`). Entry reveals are a 12px rise.
- `prefers-reduced-motion: reduce` makes every transition instant.

## Desk

Same tokens, calmer. Minimum 20px body text, 1.5 line height, 56px controls,
3px cobalt focus, single column, permanent labels, native buttons and radios.
Listing a piece is a resumable three-stage flow — Photo, About, Review — and
"Show on site" is the only publish action inside it.

## Content honesty

Only real photographs from the studio. No invented titles, prices, sizes,
testimonials, hours, simulated carvings, translations, or stock imagery.
Empty price stays empty and the piece is asked about directly.
