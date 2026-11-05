"use client";

import { useActionState, useState } from "react";
import { sendEnquiry } from "@/lib/public-actions";
import { EventBeacon } from "@/components/event-beacon";

type Props = {
  productId?: string;
  productName?: string;
  responseNote?: string;
  initialMessage?: string;
};

export function CommissionForm(props: Props) {
  const [round, setRound] = useState(0);
  return <CommissionFormInner key={round} {...props} onSendAnother={() => setRound((n) => n + 1)} />;
}

function CommissionFormInner({
  productId,
  productName,
  responseNote,
  initialMessage,
  onSendAnother,
}: Props & { onSendAnother: () => void }) {
  const [state, action, pending] = useActionState(sendEnquiry, { ok: false, message: "" });

  if (state.ok) {
    return (
      <div role="status" className="note-card rounded-[2px] p-8 sm:p-12 text-center max-w-2xl mx-auto">
        <span className="inline-block size-3 rounded-full bg-moss mb-4" />
        <h3 className="font-serif text-3xl font-medium text-ink mb-2">Thank you — your note is with the studio.</h3>
        <p className="text-sm text-umber leading-relaxed font-sans max-w-md mx-auto">
          {state.message || responseNote || "We will write back as soon as we can."}
        </p>
        <button type="button" onClick={onSendAnother} className="btn btn-secondary mt-6 min-h-11">
          Send another
        </button>
        <EventBeacon type="form" productId={productId} />
      </div>
    );
  }

  return (
    <section id="inquire" className="py-16 sm:py-24 bg-linen hairline-b">
      <div className="shell max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta mb-2 font-bold">
            Ask the studio
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl text-ink font-normal mb-3">
            Ask about a piece
          </h2>
          <p className="text-sm text-umber max-w-lg mx-auto font-sans leading-relaxed">
            Tell us which piece, or describe what you would like made. Messages go straight to the studio.
          </p>
        </div>

        <form action={action} className="note-card rounded-[2px] p-6 sm:p-10 space-y-5">
          {productName ? (
            <div className="p-3 bg-linen hairline-box rounded-sm font-mono text-xs text-ink flex items-center justify-between">
              <span>About:</span>
              <strong className="text-terracotta">{productName}</strong>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-umber mb-1.5 font-bold">
                Your name *
              </span>
              <input
                type="text"
                name="name"
                required
                maxLength={120}
                autoComplete="name"
                className="w-full px-4 py-3 bg-linen hairline-box rounded-sm text-ink font-sans text-sm placeholder:text-umber/40 focus:outline-none focus:border-terracotta"
              />
            </label>

            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-umber mb-1.5 font-bold">
                Email or phone *
              </span>
              <input
                type="text"
                name="contact"
                required
                maxLength={160}
                autoComplete="email"
                className="w-full px-4 py-3 bg-linen hairline-box rounded-sm text-ink font-sans text-sm placeholder:text-umber/40 focus:outline-none focus:border-terracotta"
              />
            </label>
          </div>

          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-umber mb-1.5 font-bold">
              Subject
            </span>
            <input
              type="text"
              name="subject"
              defaultValue={productName ? `Asking about ${productName}` : "A question for the studio"}
              className="w-full px-4 py-3 bg-linen hairline-box rounded-sm text-ink font-sans text-sm focus:outline-none focus:border-terracotta"
            />
          </label>

          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-umber mb-1.5 font-bold">
              Your message *
            </span>
            <textarea
              name="message"
              required
              rows={4}
              maxLength={2500}
              defaultValue={initialMessage ?? (productName ? `I would like to ask about ${productName}.` : "")}
              placeholder="Which piece, or what would you like made — size, wood, where it will live?"
              className="w-full px-4 py-3 bg-linen hairline-box rounded-sm text-ink font-sans text-sm placeholder:text-umber/40 focus:outline-none focus:border-terracotta leading-relaxed"
            />
          </label>

          <input type="hidden" name="productId" value={productId ?? ""} />
          <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" />

          {state.message ? (
            <p role="alert" className="border-l-2 border-sold pl-3 text-xs text-sold font-mono">
              {state.message}
            </p>
          ) : null}

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="font-mono text-[10px] text-umber uppercase tracking-wider">
              Nothing is paid on this site — your note goes straight to the studio.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary px-8 py-3.5 shadow-sm"
            >
              {pending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
