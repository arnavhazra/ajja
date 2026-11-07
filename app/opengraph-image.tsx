import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/public-data";

export const alt = "Ajja, Collegeville";
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
        background: "#e6e8e0",
        color: "#211d16",
        padding: 64,
        fontFamily: "Georgia",
      }}
    >
      <div style={{ display: "flex", fontSize: 72 }}>{settings.businessName}</div>
      <div style={{ display: "flex", fontSize: 32, marginTop: 16 }}>
        {settings.town}, {settings.region}
      </div>
    </div>,
    { ...size },
  );
}
