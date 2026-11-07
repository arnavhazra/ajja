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

  return (
    <section id="inquire" className="note-sec hairline-b scroll-mt-[78px]">
      <div className="shell note-grid">
        <div className="note-side">
          <p className="kicker">ask the studio</p>
          <h2 className="disp mt-[10px]">
            Send a note<span className="text-sap">.</span>
          </h2>
          <p>Tell us which piece, or describe what you would like made. Messages go straight to the studio.</p>
          <p className="comm">studio visits by appointment — mention it in your note.</p>
        </div>

        {state.ok ? (
          <div role="status" className="note-card self-start">
            <span className="inline-block size-3 bg-ok mb-4" aria-hidden="true" />
            <p className="display text-2xl sm:text-3xl">Thank you — your note is with the studio.</p>
            <p className="type mt-3 text-sm text-tar-soft">
              {state.message || responseNote || "We will write back as soon as we can."}
            </p>
            <button type="button" onClick={onSendAnother} className="btn btn-secondary mt-6 min-h-11">
              Send another
            </button>
            <EventBeacon type="form" productId={productId} />
          </div>
        ) : (
          <form action={action} className="note-card self-start">
            {productName ? (
              <p className="f-row">
                <span className="text-[13px] text-tar-soft">about</span>
                <strong className="text-sap">{productName}</strong>
              </p>
            ) : null}

            <div className="f-row">
              <label htmlFor="note-name">your name *</label>
              <input id="note-name" name="name" type="text" required maxLength={120} autoComplete="name" />
            </div>
            <div className="f-row">
              <label htmlFor="note-contact">phone or email *</label>
              <input id="note-contact" name="contact" type="text" required maxLength={160} autoComplete="email" />
            </div>
            <div className="f-row">
              <label htmlFor="note-subject">subject</label>
              <input
                id="note-subject"
                name="subject"
                type="text"
                defaultValue={productName ? `Asking about ${productName}` : "A question for the studio"}
              />
            </div>
            <div className="f-row">
              <label htmlFor="note-message">message *</label>
              <textarea
                id="note-message"
                name="message"
                required
                maxLength={2500}
                defaultValue={initialMessage ?? (productName ? `I would like to ask about ${productName}.` : "")}
                placeholder="which piece, or what would you like made — size, wood, where it will live?"
              />
            </div>

            <input type="hidden" name="productId" value={productId ?? ""} />
            <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" />

            {state.message ? (
              <p role="alert" className="mt-3 border-l-2 border-sold pl-3 text-sm text-sold">
                {state.message}
              </p>
            ) : null}

            <p className="fine">nothing is paid on this site — your note goes straight to the studio.</p>
            <button className="send" type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
