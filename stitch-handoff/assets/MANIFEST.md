# Asset Manifest — megele.art

All artwork photographs live on Vercel Blob (public). Use these URLs directly in
Stitch screens — they are the only legitimate imagery. Never substitute stock or
generated "art" images.

## Hero image (home page)

- `https://tuc8n7wcfyvhqqmq.public.blob.vercel-storage.com/archive/2c95e0838add274a-bu9OuT6gWE3teOsN41btRGJ8rY7Nat.webp`
  (studio hero, focal point x=0.5 y=0.45)

## Artwork photographs

Full table in `images-table.md` (78 images across published pieces). Conventions:
- `pieces/enhanced-*.webp` — enhanced versions (~1536–2048px longest side, webp).
- `img#` 0 = cover, 1 = detail/alternate view.
- Categories: `paintings` (poured pigment on wooden panel, mostly portrait
  1536×2048), `woodwork` (furniture/objects, mixed ratios), `handwork` (empty —
  design an empty state, no artwork needed).

## Data shape a screen must fit

- Piece title: `"Poured painting · No. f8930a"` / `"Handmade woodwork · No. dc65e0"`
  (derived; real titles are rare).
- Medium line: e.g. "Poured pigment on tall wooden panel", "Pine with ceramic
  top and terracotta drawer interior".
- Price: usually `null` → render "Price on inquiry"; when present, integer cents
  USD in tabular mono.
- Status: `available` / `sold` / `on hold` chips.

## Missing visuals → image-generation prompts

Only for non-artwork surfaces. Do NOT generate fake art.

1. **Studio / workshop photo** (for "The studio" section if hero is reused):
   > Documentary photograph, interior of a small family woodworking and painting
   > workshop in Pennsylvania, warm afternoon window light, pine workbench with
   > hand tools and pigment jars, poured-paint panels drying on a rack, honest
   > unstyled realism, muted warm tones, 35mm, shallow depth of field.
2. **404 illustration** (optional): none needed — typographic dead-end is on-brand.
3. **OG/social card**: compose from hero image + masthead text; no new art.

## Fonts

- Bricolage Grotesque — display/UI (Google Fonts)
- Newsreader — prose/captions, incl. italic (Google Fonts)
- Courier Prime — ledger mono (Google Fonts)
