import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/public-data";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings();
  return {
    name: settings.businessName,
    short_name: settings.businessName,
    description: settings.heroText,
    start_url: "/",
    display: "standalone",
    background_color: "#E6E8E0",
    theme_color: "#211D16",
    lang: "en",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
