---
name: megele.art
description: Material Index
colors:
  gesso: "#f3ede2"
  plate: "#e6dccb"
  jackwood: "#2c221b"
  jackwood-soft: "#635548"
  laterite: "#894636"
  cobalt: "#28489c"
  vat: "#211913"
typography:
  display: {fontFamily: "Bricolage Grotesque", fontWeight: 700, lineHeight: 0.98}
  body: {fontFamily: "Bricolage Grotesque", fontSize: "1rem", lineHeight: 1.55}
  reader: {fontFamily: "Newsreader", fontWeight: 500}
  label: {fontFamily: "Courier Prime", fontSize: "0.75rem", letterSpacing: "0.14em"}
rounded: {control: "2px", photo: "2px"}
spacing: {gutter: "clamp(18px, 3.2vw, 48px)"}
components:
  button-primary: {backgroundColor: "{colors.jackwood}", textColor: "{colors.gesso}", rounded: "{rounded.control}", padding: "10px 22px"}
  field: {backgroundColor: "{colors.gesso}", textColor: "{colors.jackwood}", rounded: "{rounded.control}", padding: "10px 12px"}
  archival-plate: {backgroundColor: "{colors.plate}", textColor: "{colors.jackwood}", rounded: "{rounded.photo}", padding: "14px"}
---

# megele.art — Material Index

<!-- impeccable:design-map -->
Map: app/globals.css
Map: lib/pigment.ts
Full: .impeccable/design-full.md (read a section when you need its detail)
