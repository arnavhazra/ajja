# Ajja — Studio wall

## Direction

A limewashed Pennsylvania workshop. The photographs are the design: pieces hung at different sizes, captions set like paper labels. Cooler plaster, a sharper printed serif, and one sap-green taken from the paintings. Not a cream blog, and not a white jewellery gallery.

Working name: Studio wall.

The private desk stays a working tool. It reads these same tokens, so the palette changes without a layout rewrite.

## Why these choices

- Plaster and walnut ink keep text readable for older eyes and let the photographs carry the colour.
- One sap-green accent is used only for the main action, so WhatsApp, Call, and the form never compete.
- Spectral is a printed serif, slightly sharp. Source Sans 3 is the body face, a humanist sans with a large x-height. Newsreader stays the alternate display face.
- Photograph corners stay at 2px. Controls are cut at 6px, not bubbled. One shadow, and only on the mobile sheet.
- Motion is one 280ms fade of the hero photograph. Hover and press stay under 300ms. Nothing else moves on load.

## Colour

Do not add a colour without a token. Tokens live in `app/globals.css`.

Light walnut, the default

- Plaster `#E4E0D4`
- Raised `#F3F0E7`
- Bench `#D4CFC3`
- Ink `#1A1714`
- Soft ink `#4E463C`
- Joinery `#C2B8A6`
- Pine `#1B4332`
- Pine ink `#F3F0E7`
- Oxide `#8E3328`

Caption on a photograph uses caption `#F3F0E7` and caption ink `#1A1714`. Those two stay put in clay, ink, and dark, so type on a picture does not flip when the wall does. High contrast uses caption `#F7F4EC` on caption ink `#100E0C` in light, and caption `#F7F4EC` on caption ink `#090807` in dark.

Dark walnut, when the system asks for it

- Plaster `#1C1B18`
- Raised `#262420`
- Bench `#2E2B26`
- Ink `#F3F0E7`
- Soft ink `#B0A898`
- Joinery `#4A463F`
- Pine `#8FD4AE`
- Pine ink `#102218`
- Oxide `#F0B2A8`

Clay, the same roles retinted

- Plaster `#E8DFD4`
- Raised `#F6F0E8`
- Bench `#D8CDBF`
- Ink `#1C1510`
- Soft ink `#554536`
- Joinery `#C4B5A4`
- Accent `#7A341C`
- Accent ink `#F6F0E8`
- Oxide `#8E3328`

Clay, dark

- Plaster `#1C1814`
- Raised `#261F1A`
- Bench `#2E2822`
- Ink `#F6F0E8`
- Soft ink `#C4B4A4`
- Joinery `#4A3E34`
- Accent `#F0A27A`
- Accent ink `#2A140C`
- Oxide `#F0B2A8`

Ink, the same roles retinted

- Plaster `#E2E0D8`
- Raised `#F2F1EB`
- Bench `#D2CFC6`
- Ink `#161614`
- Soft ink `#45423C`
- Joinery `#B7B3A8`
- Accent `#1A467C`
- Accent ink `#F2F1EB`
- Oxide `#8E3328`

Ink, dark

- Plaster `#16171A`
- Raised `#1E2024`
- Bench `#26282C`
- Ink `#F2F1EB`
- Soft ink `#B4B0A6`
- Joinery `#3C4048`
- Accent `#9EC1EE`
- Accent ink `#101820`
- Oxide `#F0B2A8`

High contrast pushes ink and paper further apart and thickens the focus ring.

Light

- Paper `#F7F4EC`
- Ink `#100E0C`
- Soft ink `#3A332C`
- Line `#100E0C`
- Accent `#083526`
- Accent ink `#F7F4EC`

Dark

- Paper `#090807`
- Ink `#F7F4EC`
- Soft ink `#E8E2D6`
- Line `#F7F4EC`
- Accent `#B6F3CF`
- Accent ink `#04140C`

Body text on paper is checked in `tests/contrast.test.ts`. Ink on paper is at least 7:1. Soft ink and accent ink are at least 4.5:1.

## Type

- Display: Spectral, via `next/font`. The stored desk value `"fraunces"` still selects this face. There is no settings migration.
- Alternate display, chosen in the desk: Newsreader
- Body: Source Sans 3
- Body size: 18px minimum, line-height 1.6, measure about 68 characters
- Prices use tabular numbers

Both display faces are loaded up front so the desk can switch without breaking the layout.

## Space, radius, shadow

- Space scale: 4, 8, 12, 16, 24, 32, 48, 64
- Photograph radius: 2px
- Control radius: 6px
- Sheet radius: 18px
- Shadow: one soft shadow, used on the mobile sheet only

## Motion

- Ease-out, under 300ms, transform and opacity only
- The hero photograph fades in over 280ms. `prefers-reduced-motion` removes it
- No scroll hijacking, no Lenis, no autoplay

The home hero is a plain image so the browser can paint it without the image optimizer. That choice is there to meet the LCP budget. The headline in settings is “Paintings, woodwork, and pieces made by hand.” The desk keeps `copyNeedsApproval` and shows “Needs your approval.” That line stays on the desk.

## Component log

- Motion library: `motion` is installed and not imported. The hero uses the 280ms CSS fade above. The lightbox is CSS and DOM.
- React Bits, Magic UI, and Aceternity were not added. A second motion registry would duplicate buttons and risk the home-page weight budget.
- shadcn/ui CLI was not run. Buttons, fields, and the bottom sheet are local components on these tokens.
- Skill installs are recorded below.

## Skill installs

These landed in `.agents/skills`.

- `frontend-design`
- Emil Kowalski set: `animate`, `animate-expo`, `animation-performance`, `animation-vocabulary`, `apple-design`, `ask-sonner`, `break-ui`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `mobile-native`, `pick-ui-library`, `prototype`, `remove-animations`, `review-animations`, `write-swift`
- `web-design-guidelines`
- `baseline-ui`

The direction above was chosen by reading the photographs and the brief, not by copying a DESIGN.md from another brand.

## Voice

First person, warm, short sentences, as the family. No years in business, no awards, no review counts, no stock claims. If a sentence is not yet his, the desk shows “Needs your approval.”

## Do

- One main action on a screen
- Real photographs, 4:5 crops, focal point from the desk
- Words on buttons
- Empty states that say what is true

## Do not

- Invent a price, a title, a testimonial, or a countdown
- Show a phone number that was not typed in
- Use a purple gradient, a default system font, or a grid of identical shadowed cards
- Use uppercase eyebrows, collection numbers, or trailing arrows
- Ask people to make an account
