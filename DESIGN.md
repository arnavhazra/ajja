# Ajja — Linen Archive Folio

## Direction

An editorial archive folio for original poured paintings and handcrafted woodwork from Collegeville, Pennsylvania. The original photographs carry the color; the canvas, hairlines, and typography remain disciplined, tactile, and quiet.

Working name: Linen Archive Folio.

Inspired by museum folios and tactile catalog raisonnés: warm linen ground, architectural 1px hairlines, Cormorant Garamond for display and editorial reflection, Plus Jakarta Sans for reading, and Space Mono for archival specimen facts.

## Palette

Single unified archive palette across the public shop:

- Linen `#F7F4EE` — primary ground, archival paper
- Bone `#EFEAE1` — specimen cards, ledger plates, footer ground
- Bone Dark `#E5DEC9` — card image well, borders, accents
- Ink `#1E1B18` — deep charcoal mineral ink for headlines and primary text
- Umber `#6B6258` — muted earth tone for secondary metadata, descriptions, and labels
- Terracotta `#C2593F` — warm kiln red accent for primary calls-to-action, badges, and focal moments
- Terracotta Dark `#A3442D` — deep brick red for hover and pressed button states
- Moss `#3E5C47` — forest glaze green for active studio status and authenticity markers
- Hairline `rgba(30, 27, 24, 0.11)` — architectural 1px borders

Contrast ratios meet WCAG AA/AAA:
- Ink on Linen: >15:1 (AAA)
- Ink on Bone: >14:1 (AAA)
- Umber on Linen: >5.4:1 (AA)
- Umber on Bone: >4.9:1 (AA)
- Moss on Linen: >6.7:1 (AA)
- Linen on Terracotta Dark: >5.5:1 (AA)

## Typography

- Display & Headlines: **Cormorant Garamond** (Google Fonts). Editorial serif, high contrast, classical proportions.
- Reading & UI: **Plus Jakarta Sans** (Google Fonts). Humanist sans with clear geometry, high legibility, and warm tone.
- Archival Data & Monospace: **Space Mono** (Google Fonts). Monospaced archival ledger facts (medium, dimensions, catalog numbers, studio tags).

## Layout & Structure

- Maximum container: 1440px editorial grid with responsive 16px/32px gutters.
- Hairline division: 1px subtle architectural borders (`hairline-t`, `hairline-b`, `hairline-box`) replacing heavy card shadows.
- Photography: uncropped native aspect ratios or deliberate 4:3, 4:5, and 1:1 frames with image zoom on hover and macro loupe on the hero piece.
- Paper grain: 3.6% subtle fractal noise overlay preserving tactile cotton-rag physical presence across the viewport.

## Motion & Transitions

- Primary animation engine: **GSAP** (GreenSock) for choreographing the hero reveal and section triggers.
- Smooth scroll: **Lenis** as the single smooth scroll engine, synchronised with ScrollTrigger and destroyed on cleanup.
- Hero sequence: staggered entrance of the catalog stamp, headline, manifesto, action buttons, and hero specimen plate.
- Interactive grain loupe: 2.5× optical zoom lens following cursor on the hero piece, revealing paint texture and brushwork.
- Respect reduced motion: when `prefers-reduced-motion: reduce` is detected, all scrubbed timelines and Lenis smooth scrolling are bypassed, rendering final visual states instantly.

## Content Honesty

- Every piece displayed is a real photograph from the Collegeville studio.
- No synthetic stock images, Unsplash fallbacks, or generated filler.
- Honest titles: if unassigned, identified accurately by medium ("Poured painting" or "Woodwork").
- Honest pricing: if not yet set, clearly invites inquiry ("Studio Collection · Inquire").
