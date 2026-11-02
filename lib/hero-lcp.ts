import manifest from "@/lib/lcp-manifest.json";

export type HeroDelivery = {
  src: string;
  width: number;
  height: number;
  srcSet?: string;
  sizes?: string;
};

export function heroDelivery(url: string): HeroDelivery {
  if (url && manifest.source === url && manifest.src && manifest.width > 0 && manifest.height > 0) {
    return {
      src: manifest.src,
      width: manifest.width,
      height: manifest.height,
      srcSet: manifest.srcSet || undefined,
      sizes: manifest.sizes || undefined,
    };
  }
  return { src: url, width: 1200, height: 1600 };
}
