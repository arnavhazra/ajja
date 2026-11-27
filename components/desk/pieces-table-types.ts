export type DeskPieceRow = {
  id: string;
  slug: string;
  title: string;
  displayTitle: string;
  status: string;
  featured: boolean;
  price: string;
  categoryId: string;
  ready: boolean;
  missing: string[];
  needs: string[];
  imageUrl: string;
};

export type Group = { id: string; name: string };
export type CellIntent = "title" | "price" | "status" | "category";
