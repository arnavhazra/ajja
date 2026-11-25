# STITCH MASTER PROMPT — megele.art

Use this file to drive Google Stitch generation for the megele.art shop redesign.
Attach `DESIGN.md` (same folder) as the design-system source. Screenshots of the
current production site are in `current-state-screenshots/` — use them as layout
reference, not as the target aesthetic.

---

## MASTER DESIGN-SYSTEM PROMPT (set at project level)

> Design a web experience for **megele.art**, a one-of-a-kind art & woodwork shop
> run by a family studio in Collegeville, Pennsylvania. The shop sells original
> poured paintings and handcrafted woodwork. Each piece is strictly one of a kind;
> visitors inquire directly — there is no checkout.
>
> The site must feel like a printed exhibition catalogue crossed with a gallery
> ledger: warm plaster-paper backgrounds, ink-dark editorial typography, visible
> hairline rules, and quiet confidence. It must NOT look like a SaaS template,
> an AI-generated landing page, or a generic e-commerce theme.
>
> Hard rules:
> - Artwork photographs are the hero — never crop, filter, or decorate them;
>   they sit inside flat warm "plate" mats at their true aspect ratio.
> - Flat design language: no drop shadows, no glassmorphism, no gradient
>   backgrounds, no rounded-blob containers.
> - Type pairings: an expressive display grotesk/serif for headlines, an old-style
>   serif for prose and captions, and a ledger/typewriter mono for inventory
>   numbers, prices, and micro-labels.
> - Conversion path is unmistakable: artwork → inquiry. The primary CTA is always
>   "Send a note" / "Inquire about this piece".
> - Voice is quiet and first-person: "You ask first. I tell you the price and
>   whether it is still here."
> - Micro-labels in uppercase mono (~11–12px, +0.14em tracking). Prices and
>   inventory numbers in tabular figures.
> - Hairline (1px) rules separate sections; 2px solid rules for structural seams.
> - Minimum 44px tap targets; mobile-first layouts must hold at 375px.

---

## VARIANT DIRECTIONS (generate 3, keep all)

### Variant A — Editorial Luxury & High-Contrast Typography
Oversized expressive display type (display serif/grotesk pairing) as the primary
visual instrument. Asymmetric grid tension — headlines break the column, index
numbers sit in the margin. Generous negative space, tactile paper/stone surfaces,
sharp hairlines. Think: gallery monograph meets premium editorial site.
Palette stays within gesso/plate/jackwood/laterite; restraint, not saturation.

### Variant B — Kinetic Modernist & Bento Depth
Bold Swiss grid discipline: numbered index rows, structured bento-like surface
tiles in flat warm tones (no glass, no shadows — depth from tonal layering and
hairline borders). High-impact focal hero: one artwork, huge scale contrast,
tight typographic scale. Structured showcases — pieces grouped in ruled cells
with ledger metadata. The system should feel engineered for scroll choreography.

### Variant C — Atmospheric & Immersive Storytelling
Rich dark/moody direction: deep vat-ink surfaces (`#211913`) with warm candlelight
tonal ranges — artwork spotlit against darkness, dramatic focal gradients used as
*lighting* (never as UI decoration). Oversized typographic anchors in gesso-cream,
high-contrast laterite CTA focal points. Gallery-at-dusk atmosphere; conversion
points glow against the dark field.

---

## SCORING RUBRIC (apply after generating variants; 1–10 each)

1. **Visual Distinction & Memorability** — zero SaaS/Tailwind template clichés.
2. **Typographic Hierarchy & Rhythm** — clear display → subhead → body → micro-label contrast.
3. **Conversion & Scannability** — value prop + primary CTA unmistakable in 3s at 1440×900 and 375×812.
4. **Asset & Content Fit** — real copy, product data, and artwork fit without awkward crops/overflow.
5. **Motion & Interaction Potential** — supports GPU-composited scroll choreography without layout thrash.

Lock the highest total; generate all remaining routes in the winning system.

---

## PER-SCREEN PROMPTS (real copy — do not substitute Lorem Ipsum)

### Screen 1 — Home `/`

> Web, desktop-first but must hold at 375px. Landing page for a one-of-a-kind
> art & woodwork shop.
>
> **PAGE STRUCTURE:**
> 1. **Masthead:** Ledger-mono brand "megele.art" left; links right — "the index",
>    "all pieces", "the studio", "send a note"; a folio counter "saved (0)".
>    Sticky, hairline bottom rule.
> 2. **Hero:** Kicker micro-label "A FAMILY STUDIO · COLLEGEVILLE, PENNSYLVANIA".
>    Display headline (real copy): "Objects shaped by patience, poured pigment,
>    and timber." Sub copy: "Original poured paintings and fine handcrafted
>    woodwork from our studio in Collegeville, Pennsylvania. Each piece is
>    strictly one of a kind. Inquiries are welcomed directly." One large artwork
>    photograph in a flat warm mat, right or below the headline.
> 3. **The Index:** Numbered list rows (01, 02…) — category name ("Paintings",
>    "Woodwork", "Handwork"), piece count in tabular mono ("20 pieces"), small
>    cover thumbnail, hairline separators, hover reveals a larger preview.
> 4. **Studio section:** Heading "The studio" + copy: "We make poured paintings
>    and fine woodwork in our Collegeville, Pennsylvania workshop. Each work is
>    one of a kind. When a piece speaks to you, inquire directly to confirm
>    availability and discuss custody."
> 5. **Buying FAQ:** Two Q/A pairs — "How do I buy a piece?" / "Send a message.
>    I tell you the price and whether it is still here. You do not pay on this
>    website." and "Where is the studio?" / "Collegeville, Pennsylvania…".
> 6. **Inquiry section (#inquire):** Heading + short note form (name, email,
>    message, which piece), primary CTA "Send a note".
> 7. **Footer:** Dark vat-ink footer, ledger-mono — shop name, town, policies /
>    privacy links, "No payment is taken on this website."

### Screen 2 — Category index `/category/paintings` (also all/woodwork/handwork)

> Grid of artwork cards on gesso ground. Header repeats masthead. Page head:
> kicker "THE INDEX / 01", display title "Paintings", count "20 pieces".
> Card = artwork photo in flat warm mat at its true aspect ratio (object-contain),
> caption row: small tick, title like "Poured painting · No. f8930a" (serif,
> truncated), price or "price on inquiry" in tabular mono, a small save button.
> 2-col grid at mobile, 3-col at desktop, hairline-column gutters. Empty state for
> Handwork: "Nothing here yet — the bench is full, the shelf is not."

### Screen 3 — Piece detail `/p/[slug]`

> Single artwork page. Large photo in a plate mat left (~60%), details right:
> kicker "POURED PAINTING · NO. F8930A", display title, medium line
> ("Poured pigment on tall wooden panel"), status chip "available" (verdigris
> mono), price or "Price on inquiry", description paragraph, primary CTA
> "Inquire about this piece" (jackwood fill → laterite hover), secondary
> "Save to folio". Below: 2 thumbnail images, hairline-separated specs
> (medium, dimensions if present, status, ref). Footer as home.

### Screen 4 — Policies `/policies`

> Editorial single column (max ~720px) on gesso. Display title "The terms".
> Three hairline-separated sections in first-person voice: "Buying" — "You ask
> first. I confirm the price and whether the piece is still here. Nothing is paid
> through this website." "Collecting" — "Pieces can be collected in Collegeville
> once we agree a time. Shipping only happens if we arrange it." "Returns" —
> "These are single pieces. A sale is final once you have the piece, unless we
> agree otherwise in writing."

### Screen 5 — Privacy `/privacy`

> Same editorial template. Title "Privacy". Copy: "This shop keeps the minimum
> it needs. Enquiry messages are kept so I can answer you and are removed after
> a year. Vercel Analytics is used without a tracking cookie. Photographs are
> stored so the shop can show them."

### Screen 6 — 404 `/missing` (optional)

> Quiet dead-end: huge "No such piece." display line, mono sub "the index
> remembers everything it ever hung — this was never hung", link "Back to the
> index".

---

## MOTION NOTES (for the build, not Stitch)

Entrance reveals: staggered fade+rise on index rows (transform/opacity only,
300–600ms, `cubic-bezier(0.16,1,0.3,1)`). Image mats: subtle scale settle on
load. Hover: hairline underline sweeps, cover preview fade-in. Scroll: parallax
on the hero figure only, ±4%. Everything off under `prefers-reduced-motion`.
