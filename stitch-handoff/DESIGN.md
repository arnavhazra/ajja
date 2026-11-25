# Design System: megele.art — "Wet Edge"
**Project:** ajja shop — poured paintings & fine woodwork, Collegeville, Pennsylvania

## 1. Visual Theme & Atmosphere

A gallery wall translated to the web: warm plaster-paper surfaces, ink-dark typography, and the feel of a printed exhibition catalogue. Dense but unhurried. Every element sits on a visible hairline grid, like ledger rules. The mood is tactile and analog — no glassmorphism, no gradients-as-decoration, no SaaS-template purple. Personality comes from per-piece "pour" accent colors drawn from the artwork itself.

## 2. Color Palette & Roles

| Token | Hex | Descriptive name | Role |
|---|---|---|---|
| `--gesso` | `#f3ede2` | Warm gesso plaster | Primary page background ("wall") |
| `--plate` | `#e6dccb` | Unfinished plate board | Sunken panels, image mats, hover fills |
| `--plate-deep` | `#d8cbb6` | Aged plate edge | Deeper wells, image placeholder field |
| `--jackwood` | `#2c221b` | Jackwood ink | Primary text, hairline rules, buttons |
| `--jackwood-soft` | `#635548` | Weathered jackwood | Secondary text, captions, meta labels |
| `--laterite` | `#894636` | Laterite clay red | Primary accent — links, active states, CTA |
| `--laterite-deep` | `#6e3527` | Fired laterite | Hover/pressed accent |
| `--cobalt` | `#28489c` | Cobalt pigment | Secondary accent — status, saved states |
| `--vat` | `#211913` | Deep vat ink | Footer / inverted sections, darkest surface |
| `--ok` | `#2f6b45` | Verdigris green | "Available" status |
| `--sold` | `#8a5a24` | Ochre seal | "Sold / on hold" status |
| `--warn` | `#9c3a2f` | Cadmium warning | Errors and warnings |

Per-piece accent: each artwork carries `--pig` (dominant pigment) and `--pig-ink` (legible ink over it). Reserved for artwork-adjacent UI only — captions, ticks, hover washes.

Legacy aliases still in code: `--wall` = `--gesso`, `--tar` = `--jackwood`, `--sap` = `--laterite`.

## 3. Typography Rules

- **Display / UI:** Bricolage Grotesque (`--font-display`). Headlines, buttons, nav, index rows. Use wide, confident tracking; oversized display sizes (clamp 3–7rem) for hero headlines. Uppercase micro-labels at ~11–12px with +0.14em tracking.
- **Prose / captions:** Newsreader (`--font-reader`), normal + italic. Body copy, gallery captions, editorial notes. Italic for asides and voice.
- **Ledger / mono:** Courier Prime (`--font-type`, wired to `--font-mono`). Inventory numbers, prices, tick labels, footer meta — the "printed ledger" voice. All prices and counts use tabular figures.
- Numerals in money, counts, and inventory refs must render `tabular-nums`.

## 4. Component Stylings

- **Buttons:** Sharp 2px radii (concentric: outer 2px, inner 1px). Primary = jackwood fill, gesso text → laterite on hover. Secondary = 1px hairline border, transparent fill. Minimum 44px tap targets.
- **Cards / artwork figures:** Flat, no drop shadows. Image sits inside a `--plate` / `--plate-deep` mat with ~12px padding (`object-contain`, true aspect ratio preserved — never crop art). Caption row below: tick mark + truncated title + tabular price.
- **Hairlines:** 1px `--jackwood` rules at 12–20% opacity separate sections and index rows; 2px solid rules for structural seams.
- **Inputs:** Hairline-bordered fields on gesso, 2px radius, laterite focus ring. Honeypot hidden field present on forms.
- **Header:** Sticky masthead, mono brand mark "megele.art", ledger-style links ("the index", "all pieces", "the studio", "send a note"), folio counter. Mobile: full-screen `<dialog>` menu.
- **Status chips:** Ledger-mono micro-labels — "available" (verdigris), "sold" (ochre), "on hold".

## 5. Layout Principles

- Gutter `--gutter: clamp(18px, 3.2vw, 48px)`; shell max-width 1680px.
- Asymmetric editorial grids: oversized headline columns, numbered index lists (01 / 02 / 03) with cover thumbnails, generous negative space around the hero figure.
- Everything aligns to the hairline grid — content never floats inside padded blobs.
- Motion: slow, weighted, gallery-like. `cubic-bezier(0.16,1,0.3,1)` entrances (300–600ms), transform/opacity only, full `prefers-reduced-motion` support.

## 6. Hard Constraints (brand rules)

- Photographs show real artworks only — never stock or AI-fake placeholder art in final screens.
- No gradients-as-decoration, no rounded-blob SaaS aesthetics, no generic hero templates.
- Copy voice is quiet and direct ("You ask first. I tell you the price…"), never marketing-speak.
