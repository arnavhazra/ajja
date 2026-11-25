# .stitch/DESIGN.md — megele.art, locked system (Variant A "Editorial Luxury")

Winning Stitch direction (score 41/50) — gallery monograph / archival ledger.
Stitch project: `projects/894790451361177815` ("megele.art — public site redesign").
Design system asset: `assets/7a2b4697fbd245f6be8e7b1d790cba6f`.

## Locked tokens (map onto existing globals.css)

- `--gesso #f3ede2` page ground ("wall"), `--plate #e6dccb` / `--plate-deep #d8cbb6` image mats & sunken panels
- `--jackwood #2c221b` ink text + hairline rules, `--jackwood-soft #635548` captions/meta
- `--laterite #894636` primary accent (links, CTA hover, focus), `--laterite-deep #6e3527` pressed
- `--cobalt #28489c` saved/secondary states, `--vat #211913` dark footer/inverted
- `--ok #2f6b45` available, `--sold #8a5a24` sold/hold, `--warn #9c3a2f` errors
- Per-piece `--pig` / `--pig-ink` accents stay artwork-adjacent only

## Type system

- Display/UI: Bricolage Grotesque — hero `clamp(3rem, 6vw, 7rem)` w600 lh1.05 tracking −0.02em; headline-lg 2.5rem; headline-md 1.75rem
- Prose/captions: Newsreader + italic — body-lg 1.25rem, body-md 1rem lh1.6, caption 0.875rem
- Ledger/mono: Courier Prime — micro-label 0.75rem +0.14em uppercase, ledger 0.8125rem; `tabular-nums` on all prices/counts/refs

## Component language (from winning screens)

- Sharp 2px radii; no drop shadows ever; depth = tonal plate tiers + hairlines (1px jackwood@12–20%, 2px for seams)
- Masthead: sticky, mono brand "MEGELE.ART [folio]", links "the index / all pieces / the studio / send a note", `saved (n)` counter, hairline bottom rule
- Hero: kicker micro-label → massive serif headline → serif sub → flat-matted artwork figure w/ caption row (tick + mono detail + status)
- Index rows: `01` mono numeral + display name + `[ N PIECES ]` bracketed tabular + medium note + cover thumb + `→`, hairline separators
- Studio block: hairline-framed asymmetric panel, quote rule, spec callouts (FOUNDED / CURATION / TRANSACTIONS)
- FAQ: "LEDGER ENTRY · 0N" cards, quiet serif Q/A
- Inquiry: hairline inputs on gesso, laterite focus ring, jackwood CTA "Send a note →"
- Footer: vat-ink, ledger-mono columns, "No payment is taken on this website."

## Motion spec

transform/opacity only; entrances 300–600ms `cubic-bezier(0.16,1,0.3,1)`; staggered index rows; hairline underline sweeps on hover; ≤4% hero parallax; all off under `prefers-reduced-motion`.

## Variant archive (kept in Stitch project)

- A — Editorial Luxury — screen `d7fdff09743b4d6eb4ca113b37e7df69` (winner)
- B — Kinetic Modernist — screen `4d5a0716b66348b583361a6053748a44`
- C — Atmospheric Dark — screen `3f13d0691d7241d697d97ccf4e416615`
