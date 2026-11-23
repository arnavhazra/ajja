import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = brand.name;

// Typographic card in the Wet Edge palette — no fake art, just the name.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          background: "#f3ede2",
        }}
      >
        <div
          style={{
            fontSize: 34,
            color: "#4a423a",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          A material index
        </div>
        <div style={{ fontSize: 120, color: "#1f1a14", fontWeight: 700, lineHeight: 1.05 }}>
          {brand.name}
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#4a423a",
            marginTop: 32,
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Handmade pieces from a family studio, photographed as they are.
        </div>
      </div>
    ),
    { ...size },
  );
}
