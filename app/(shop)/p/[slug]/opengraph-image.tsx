import { ImageResponse } from "next/og";
import { pieceTitle } from "@/components/product-card";
import { formatMoney } from "@/lib/money";
import { loadProduct } from "@/lib/public-data";

export const alt = "A piece from Ajja";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProductImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { product } = await loadProduct(slug);
  const title = pieceTitle(product?.title ?? "", product?.slug);
  const price = formatMoney(product?.priceMinor ?? null, product?.currency) ?? "Inquire for price";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "#f3eee4",
        color: "#1a1410",
        padding: 64,
        fontFamily: "Georgia",
      }}
    >
      <div style={{ display: "flex", fontSize: 64 }}>{title}</div>
      <div style={{ display: "flex", fontSize: 32, marginTop: 16 }}>{product?.status === "sold" ? "Sold" : price}</div>
    </div>,
    { ...size },
  );
}
