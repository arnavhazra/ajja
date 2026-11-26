import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";
import { pieceTitle } from "@/lib/piece-title";
import { formatMoney } from "@/lib/money";
import { loadProduct } from "@/lib/public-data";

export const alt = `A piece from ${brand.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProductImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { product } = await loadProduct(slug);
  const title = pieceTitle(product?.title ?? "", product?.categorySlug, product?.attributes, product?.id ?? product?.slug);
  const price = formatMoney(product?.priceMinor ?? null, product?.currency) ?? "Price on inquiry";
  const cover = product?.images[0];
  const pigment = product?.pigment ?? "#894636";
  const pigmentInk = product?.pigmentInk ?? "#f6f0e5";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f3ede2",
      }}
    >
      {cover ? (
        <div style={{ display: "flex", width: "58%", height: "100%", background: "#e6dccb", padding: 40 }}>
          <img
            src={cover.url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          flex: 1,
          background: pigment,
          color: pigmentInk,
          padding: 64,
          fontFamily: "Georgia",
        }}
      >
        <div style={{ display: "flex", fontSize: 56, lineHeight: 1.15 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 20 }}>{product?.status === "sold" ? "Sold" : price}</div>
        <div style={{ display: "flex", fontSize: 24, marginTop: 28, opacity: 0.75 }}>{brand.name}</div>
      </div>
    </div>,
    { ...size },
  );
}
