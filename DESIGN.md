# Ajja — Wet Edge

## Direction

The shop is a quiet grey wall and the paintings are the only loud thing on it. Poured pigment is wet, glossy, and unpredictable; everything around it is dry, flat, and exact. Type is big and tightly set, like a gallery wall title. Each piece lends the page its own colour: the accent on a card, a product page, and its share image is sampled from that piece's photograph (`lib/pigment.ts`).

## Palette

Defined in `app/globals.css`.

- `--gesso` `#ecede8` — page ground, a cool primed white.
- `--plate` / `--plate-deep` — panels and form wells.
- `--ink` `#18222c` — Payne's grey text and primary buttons.
- `--ink-soft` — captions and secondary text.
- `--cobalt` `#2a44c4` — house accent when a piece has no colour of its own.
- `--pour` / `--pour-ink` — per-piece accent and its contrast-safe text colour, set inline from the sampled pigment.
- `--ok`, `--sold` — status only.
- `--night` — footer and full-screen viewer.

Old `--paper*` and `--accent` names are kept as aliases so the desk keeps working.

## Typography

- Display and UI: Bricolage Grotesque (`--font-bricolage`), heavy and tightly tracked for headlines (`.display`).
- Prose and captions: Newsreader (`--font-newsreader`), italic for captions (`.caption`).
- Prices and counts use tabular numbers (`.nums`).

## Layout

- Home: typographic hero beside the settings hero photograph → the works wall (native aspect ratios, filter by Available / group / Sold) → colour index → studio → how buying works + questions → visit + enquiry form.
- Piece page: large viewer with full-screen dialog and arrow keys, facts that exist (nothing invented), enquiry form, related pieces, sticky enquiry button on phones.
- Tap targets at least 44px. Visible focus rings everywhere.

## Motion

- Lenis smooth scroll (one engine only) + GSAP ScrollTrigger, started in `components/motion-root.tsx`.
- Page reveals run from `components/motion-scan.tsx` after hydration: `data-split` word rise, `data-reveal`, `data-unveil` clip, `data-drift` parallax, `data-scrub-words`.
- The hero photograph gets a WebGL wet-pigment ripple (`components/shop/pour-canvas.tsx`) on fine pointers only; the optimised `<Image>` underneath is always the fallback.
- `prefers-reduced-motion: reduce` disables Lenis, GSAP, and WebGL and shows final states.

## Desk

Same tokens, calmer. Sidebar on wide screens, scrolling tab row on phones. Plain words: Photos, Price, Hide, Mark as sold.

## Content honesty

Only real photographs from the studio. No invented titles, prices, sizes, testimonials, or hours. Empty price reads "Ask for the price".
