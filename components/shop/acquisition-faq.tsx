import type { ShopSettings } from "@/lib/settings";

/** Acquisition protocol: numbered steps and hairline ledger Q&A tablets. */
export function AcquisitionFaq({ settings }: { settings: ShopSettings }) {
  const items: { title: string; category: string; content: string }[] = [];
  if (settings.leadTime.trim()) items.push({ title: "Timing", category: "SCHEDULE", content: settings.leadTime });
  if (settings.holds.trim()) items.push({ title: "Holds", category: "AVAILABILITY", content: settings.holds });
  if (settings.commissions.trim()) items.push({ title: "Custom work", category: "COMMISSIONS", content: settings.commissions });
  for (const faq of settings.faqs) {
    items.push({ title: faq.q, category: "STUDIO NOTE", content: faq.a });
  }
  if (settings.policies.buying.trim()) {
    items.push({ title: "Buying", category: "TRANSACTION MODEL", content: settings.policies.buying });
  }
  if (settings.policies.collection.trim()) {
    items.push({ title: "Collection & delivery", category: "HANDOVER", content: settings.policies.collection });
  }
  if (settings.policies.returns.trim()) {
    items.push({ title: "Returns", category: "TERMS", content: settings.policies.returns });
  }

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
    <section id="buying" className="scroll-mt-[72px] border-t border-line py-14 md:py-20" aria-labelledby="buying-title">
      <div className="shell">
        <header className="mb-8 flex flex-col justify-between gap-3 md:mb-10 md:flex-row md:items-baseline">
          <div className="flex flex-wrap items-baseline gap-3.5">
            <span className="micro-label text-sap">Direct arrangements</span>
            <h2 id="buying-title" className="disp text-2xl text-tar md:text-3xl" data-reveal="">
              Acquisition Protocol
            </h2>
          </div>
          <span className="ledger text-xs uppercase text-tar-soft">[ DIRECT INQUIRY · NO ONLINE CART ]</span>
        </header>

        {steps.length ? (
          <ol className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col justify-between rounded-[2px] border border-line bg-wall-deep/55 p-6"
                data-reveal=""
              >
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-line pb-2.5">
                    <span className="micro-label text-sap">Step · {String(index + 1).padStart(2, "0")}</span>
                    <span className="ledger text-xs text-tar-soft">PROTOCOL</span>
                  </div>
                  <h3 className="disp text-xl text-tar">{step.title}</h3>
                  <p className="type mt-2.5 text-base leading-relaxed text-tar-soft">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {items.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {items.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className="flex flex-col justify-between rounded-[2px] border border-line bg-surface-low p-7 md:p-8"
                data-reveal=""
              >
                <div>
                  <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-3">
                    <span className="micro-label text-sap">
                      Ledger entry · {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="ledger text-xs uppercase text-tar-soft">{item.category}</span>
                  </div>
                  <h3 className="disp text-xl text-tar md:text-2xl">{item.title}</h3>
                  <p className="type mt-3 text-base leading-relaxed text-tar-soft md:text-lg">{item.content}</p>
                </div>
                <div className="ledger mt-6 flex items-center gap-2 border-t border-line/70 pt-3.5 text-xs text-tar-soft">
                  <span className="inline-block size-2 rounded-full bg-ok" aria-hidden="true" />
                  <span>Direct correspondence · {settings.town}, {settings.region}</span>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
