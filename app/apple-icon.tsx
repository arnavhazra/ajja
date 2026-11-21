import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f0e5",
        color: "#30261e",
        fontSize: 120,
        fontWeight: 800,
        fontFamily: "Georgia",
      }}
    >
      m<span style={{ color: "#894636" }}>.</span>
    </div>,
    { ...size },
  );
}
