import type { ShopSettings } from "@/lib/settings";

/** The terms — every question the owner actually answered, typed in full. */
export function AcquisitionFaq({ settings }: { settings: ShopSettings }) {
  const items: { title: string; content: string }[] = [];
  if (settings.leadTime.trim()) items.push({ title: "timing", content: settings.leadTime });
  if (settings.holds.trim()) items.push({ title: "holds", content: settings.holds });
  if (settings.commissions.trim()) items.push({ title: "custom work", content: settings.commissions });
  for (const faq of settings.faqs) items.push({ title: faq.q, content: faq.a });
  if (settings.policies.buying.trim()) items.push({ title: "buying", content: settings.policies.buying });
  if (settings.policies.collection.trim()) items.push({ title: "collection & delivery", content: settings.policies.collection });
  if (settings.policies.returns.trim()) items.push({ title: "returns", content: settings.policies.returns });

  if (!items.length) return null;

  return (
    <section id="buying" className="hairline-b scroll-mt-[78px]">
      <div className="shell terms-wrap">
        <div className="sec-head">
          <div>
            <p className="kicker">good to know</p>
            <h2 className="disp mt-[10px]">
              The terms<span className="text-sap">.</span>
            </h2>
          </div>
          <p className="sub type">Buying, delivery &amp; care — written plainly, because nothing is sold through a cart.</p>
        </div>
        <div className="terms">
          {items.map((item) => (
            <div key={item.title} className="term">
              <p className="q">{item.title.toLowerCase()}</p>
              <p className="a">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
