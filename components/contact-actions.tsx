import { pieceTitle } from "./product-card";
import { EnquiryForm } from "./enquiry-form";
import { formatMoney } from "@/lib/money";
import { siteUrl } from "@/lib/site-url";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";
import { digits, pieceMessage, whatsAppHref } from "@/lib/whatsapp";
import { ShareSave } from "./share-save";
import { TrackedLink } from "./tracked-link";

export function ContactActions({ product, settings, path }: { product: PublicProduct; settings: ShopSettings; path: string }) {
  const title = pieceTitle(product.title, product.slug);
  const price = product.status === "draft" ? null : formatMoney(product.priceMinor, product.currency);
  const url = `${siteUrl()}${path}`;
  const message = pieceMessage({ shop: settings.businessName, title, price, url });
  const whatsapp = digits(settings.whatsapp);
  const phone = digits(settings.phone);
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        {whatsapp ? (
          <TrackedLink className="btn btn-primary" href={whatsAppHref(settings.whatsapp, message)} type="whatsapp">
            Message on WhatsApp
          </TrackedLink>
        ) : null}
        {phone ? (
          <TrackedLink className="btn btn-secondary" href={`tel:${phone}`} type="call">
            Call now
          </TrackedLink>
        ) : null}
        {!whatsapp && !phone ? <p className="text-ink-soft">Send a message below to inquire.</p> : null}
      </div>
      <ShareSave title={title} url={url} slug={product.slug} whatsapp={settings.whatsapp} shop={settings.businessName} />
      <EnquiryForm productId={product.id} productName={title} />
      <aside className="border-t border-line pt-4">
        <p>
          {settings.ownerName} in {settings.town}, {settings.region}.
        </p>
        <p>{settings.paymentNote}</p>
        {settings.responseNote ? <p>{settings.responseNote}</p> : null}
      </aside>
    </div>
  );
}
