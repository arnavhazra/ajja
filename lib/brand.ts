/**
 * The public brand, fixed at the platform level. Deliberately independent of
 * the saved business/contact settings so renaming the studio's contact fields
 * can never silently rebrand the site.
 */
export const brand = {
  name: "megele.art",
  domain: "megele.art",
  url: "https://megele.art",
  title: "megele.art",
  description:
    "A material index of handmade pieces from a family studio. Every piece is photographed as it is — ask the studio, nothing is paid online.",
} as const;
