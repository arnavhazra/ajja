export type PublicImage = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  blurData: string | null;
  focalX: number;
  focalY: number;
  alt: string;
  sortOrder: number;
};

export type PublicProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceMinor: number | null;
  comparePriceMinor: number | null;
  currency: string;
  condition: string;
  quantity: number | null;
  sku: string | null;
  attributes: Record<string, string>;
  tags: string[];
  status: string;
  featured: boolean;
  showInStudio: boolean;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  images: PublicImage[];
  pigment: string;
  pigmentInk: string;
  createdAt: string;
};
