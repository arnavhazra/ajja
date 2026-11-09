import type { ShopSettings } from "@/lib/settings";

/** The terms: how buying works, in three steps, then the questions owners actually answered. */
export function AcquisitionFaq({ settings }: { settings: ShopSettings }) {
  const items: { title: string; content: string }[] = [];
  if (settings.leadTime.trim()) items.push({ title: "Timing", content: settings.leadTime });
  if (settings.holds.trim()) items.push({ title: "Holds", content: settings.holds });
  if (settings.commissions.trim()) items.push({ title: "Custom work", content: settings.commissions });
  for (const faq of settings.faqs) items.push({ title: faq.q, content: faq.a });
  if (settings.policies.buying.trim()) items.push({ title: "Buying", content: settings.policies.buying });
  if (settings.policies.collection.trim()) items.push({ title: "Collection & delivery", content: settings.policies.collection });
  if (settings.policies.returns.trim()) items.push({ title: "Returns", content: settings.policies.returns });

  const steps = [
    { title: "Ask", body: settings.policies.buying || "Send the studio a note about the piece." },
    {
      title: "Arrange",
      body: settings.paymentNote || settings.policies.collection || "Payment and collection are arranged directly with the studio.",
    },
    { title: "Collect or ship", body: settings.policies.collection },
  ].filter((step) => step.body.trim());

  if (!steps.length && !items.length) return null;

  return (
    <section id="buying" className="pr-section shell scroll-mt-[60px]" aria-labelledby="buying-title">
      <header className="pr-head">
        <div>
          <p className="pr-label">How buying works</p>
          <h2 id="buying-title" className="pr-h2" data-reveal="">
            Ask, arrange, collect
          </h2>
        </div>
        <p className="pr-head-note">Nothing is paid online. Every piece is a conversation with the studio first.</p>
      </header>

      {steps.length ? (
        <ol className="pr-steps">
          {steps.map((step, index) => (
            <li key={step.title} className="pr-step" data-reveal="">
              <span className="pr-step-num" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      ) : null}

      {items.length ? (
        <div className="pr-faq">
          {items.map((item, index) => (
            <details key={`${item.title}-${index}`} className="pr-faq-item" data-reveal="">
              <summary>
                <span>{item.title}</span>
                <span className="pr-faq-mark" aria-hidden="true" />
              </summary>
              <p>{item.content}</p>
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}
