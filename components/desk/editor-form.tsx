import { savePiece } from "@/lib/desk-actions";
import { minorToDollars } from "@/lib/money";
import { formatNewYorkInput } from "@/lib/time";
import type { categories, products } from "@/lib/db/schema";

type Product = typeof products.$inferSelect;
type Group = typeof categories.$inferSelect;

export function EditorForm({
  product,
  groups,
  fields,
  customText,
}: {
  product: Product;
  groups: Group[];
  fields: { key?: string; label?: string }[];
  customText: string;
}) {
  const attributes = (product.attributes ?? {}) as Record<string, string>;
  return (
    <form id="piece-form" action={savePiece} className="grid gap-3">
      <input type="hidden" name="id" value={product.id} />
      <label className="grid gap-1" id="f-title">
        Name
        <input className="field" name="title" defaultValue={product.title} />
      </label>
      <label className="grid gap-1" id="f-price">
        Price in dollars
        <input className="field" name="price" inputMode="decimal" defaultValue={minorToDollars(product.priceMinor)} />
      </label>
      <label className="grid gap-1">
        Crossed-out price, only if it is higher
        <input className="field" name="compare" inputMode="decimal" defaultValue={minorToDollars(product.comparePriceMinor)} />
      </label>
      <label className="grid gap-1" id="f-group">
        Group
        <select className="field" name="categoryId" defaultValue={product.categoryId ?? ""}>
          <option value="">No group</option>
          {groups.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        Condition
        <input className="field" name="condition" defaultValue={product.condition} />
      </label>
      <label className="grid gap-1" id="f-size">
        Size
        <input className="field" name="size" defaultValue={attributes.size ?? ""} />
      </label>
      <label className="grid gap-1">
        Details
        <textarea className="field" name="details" defaultValue={attributes.details ?? ""} />
      </label>
      <label className="grid gap-1">
        Words for the shop
        <textarea className="field" name="description" defaultValue={product.description} />
      </label>
      <label className="grid gap-1">
        Quantity, leave blank if you are not counting
        <input className="field" name="quantity" inputMode="numeric" defaultValue={product.quantity ?? ""} />
      </label>
      <label className="grid gap-1">
        SKU
        <input className="field" name="sku" defaultValue={product.sku ?? ""} />
      </label>
      <label className="grid gap-1">
        Tags, separated by commas
        <input className="field" name="tags" defaultValue={(product.tags ?? []).join(", ")} />
      </label>
      <label className="grid gap-1">
        Medium / Technique
        <input className="field" name="field:medium" placeholder="e.g. Poured pigment on birch panel, Carved aged teak" defaultValue={attributes.medium ?? ""} />
      </label>
      <label className="grid gap-1">
        Dimensions
        <input className="field" name="field:dimensions" placeholder="e.g. 24 × 36 in (61 × 91 cm)" defaultValue={attributes.dimensions || attributes.size || ""} />
      </label>
      {fields.map((field) =>
        field.key && field.key !== "medium" && field.key !== "dimensions" ? (
          <label key={field.key} className="grid gap-1">
            {field.label || field.key}
            <input className="field" name={`field:${field.key}`} defaultValue={attributes[field.key] ?? ""} />
          </label>
        ) : null,
      )}
      <label className="grid gap-1">
        Extra attributes, written as Name: value
        <textarea className="field" name="custom" defaultValue={customText} placeholder="provenance: Private collection&#10;frame: Raw maple shadowbox" />
      </label>
      <label className="grid gap-1">
        Status
        <select className="field" name="status" defaultValue={product.status}>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">On the site</option>
          <option value="sold">Sold</option>
          <option value="hidden">Hidden</option>
        </select>
      </label>
      <label className="grid gap-1">
        Show on the site at this time, New York
        <input className="field" type="datetime-local" name="publishAt" defaultValue={formatNewYorkInput(product.publishAt)} />
      </label>
      <label className="flex min-h-12 items-center gap-3">
        <input type="checkbox" name="featured" defaultChecked={product.featured} />
        Featured
      </label>
      <label className="flex min-h-12 items-center gap-3">
        <input type="checkbox" name="showInStudio" defaultChecked={product.showInStudio} />
        Show in the studio
      </label>
      <label className="grid gap-1">
        Private notes
        <textarea className="field" name="internalNotes" defaultValue={product.internalNotes} />
      </label>
      <button className="btn btn-primary w-fit" type="submit">
        Save piece
      </button>
    </form>
  );
}
