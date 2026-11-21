import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        fontSize: 22,
        fontWeight: 800,
        fontFamily: "Georgia",
      }}
    >
      m<span style={{ color: "#894636" }}>.</span>
    </div>,
    { ...size },
  );
}
