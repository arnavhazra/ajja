import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";
import { getSettings } from "@/lib/public-data";

export const alt = brand.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const settings = await getSettings();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "#f6f0e5",
        color: "#30261e",
        padding: 64,
        fontFamily: "Georgia",
      }}
    >
      <div style={{ display: "flex", fontSize: 84, fontWeight: 800 }}>
        megele<span style={{ color: "#894636" }}>.art</span>
      </div>
      <div style={{ display: "flex", fontSize: 32, marginTop: 16, color: "#66594a" }}>
        A material index — {settings.town}, {settings.region}
      </div>
    </div>,
    { ...size },
  );
}
