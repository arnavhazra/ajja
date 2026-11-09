"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { useFolio, type FolioItem } from "./collectors-folio";
import { sendEnquiry } from "@/lib/public-actions";
import { EventBeacon } from "@/components/event-beacon";

type Props = {
  productId?: string;
  productName?: string;
  responseNote?: string;
  initialMessage?: string;
  saved?: FolioItem[];
};

export function CommissionForm(props: Props) {
  const [round, setRound] = useState(0);
  return <CommissionFormInner key={round} {...props} onSendAnother={() => setRound((n) => n + 1)} />;
}

function Honeypot() {
  return <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" />;
}

function CommissionFormInner({
  productId,
  productName,
  responseNote,
  initialMessage,
  saved = [],
  onSendAnother,
}: Props & { onSendAnother: () => void }) {
  const [state, action, pending] = useActionState(sendEnquiry, { ok: false, message: "" });
  const { items } = useFolio();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const chips = items.length ? items : saved;
  const notePieces = () => {
    const field = messageRef.current;
    if (!field) return;
    const titles = chips.map((item) => item.title).filter((title, index, all) => all.indexOf(title) === index && !field.value.includes(title));
    if (!titles.length) return;
    field.value = `${field.value.trimEnd()}\n\nPieces: ${titles.join(", ")}`;
  };

  if (state.ok) {
    return (
      <div role="status" className="pr-form pr-form-done">
        <span className="pr-dot pr-dot-lg" aria-hidden="true" />
        <p className="pr-form-done-title">Thank you — your note is with the studio.</p>
        <p className="pr-form-fine">{state.message || responseNote || "We will write back as soon as we can."}</p>
        <button type="button" onClick={onSendAnother} className="pr-btn pr-btn-quiet">
          Send another note
        </button>
        <Honeypot />
        <EventBeacon type="form" productId={productId} />
      </div>
    );
  }

  return (
    <form action={action} className="pr-form" onSubmit={notePieces}>
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      {productName ? (
        <p className="pr-form-about">
          <span>About</span>
          <strong>{productName}</strong>
        </p>
      ) : null}

      <div className="pr-field">
        <label htmlFor="note-name">Your name *</label>
        <input id="note-name" name="name" type="text" required maxLength={120} autoComplete="name" />
      </div>
      <div className="pr-field">
        <label htmlFor="note-contact">Phone or email *</label>
        <input id="note-contact" name="contact" type="text" required maxLength={160} autoComplete="email" />
      </div>
      <div className="pr-field">
        <label htmlFor="note-subject">Subject</label>
        <input
          id="note-subject"
          name="subject"
          type="text"
          defaultValue={productName ? `Asking about ${productName}` : "A question for the studio"}
        />
      </div>
      <div className="pr-field">
        <label htmlFor="note-message">Message *</label>
        <textarea
          id="note-message"
          name="message"
          ref={messageRef}
          required
          maxLength={2500}
          defaultValue={initialMessage ?? (productName ? `I would like to ask about ${productName}.` : "")}
          placeholder="Which piece, or what would you like made — size, wood, where it will live?"
        />
      </div>

      {chips.length ? (
        <div className="pr-chips" aria-label="Pieces included in this note">
          {chips.slice(0, 4).map((item) => (
            <span key={item.id} className="pr-chip" title={item.title}>
              {item.imageUrl ? <Image src={item.imageUrl} alt="" width={28} height={28} className="object-cover" /> : null}
              <span className="pr-chip-title">{item.title}</span>
            </span>
          ))}
          {chips.length > 4 ? <span className="pr-chip pr-chip-more">+{chips.length - 4} more</span> : null}
        </div>
      ) : null}

      <Honeypot />
      {state.message ? (
        <p role="alert" className="pr-form-error">
          {state.message}
        </p>
      ) : null}

      <button className="pr-btn pr-btn-wide" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send to the studio"}
      </button>
      <p className="pr-form-fine">Nothing is paid on this site — your note goes straight to the studio.</p>
    </form>
  );
}
