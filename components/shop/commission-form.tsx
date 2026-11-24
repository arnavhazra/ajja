"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useFolio, type FolioItem } from "./collectors-folio";
import { sendEnquiry } from "@/lib/public-actions";
import { EventBeacon } from "@/components/event-beacon";

type Props = {
  productId?: string;
  productName?: string;
  responseNote?: string;
  initialMessage?: string;
  defaultSubject?: string;
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
  defaultSubject,
  saved = [],
  onSendAnother,
}: Props & { onSendAnother: () => void }) {
  const [state, action, pending] = useActionState(sendEnquiry, { ok: false, message: "" });
  // `navigator.onLine` is undefined in the Node SSR runtime, so only an explicit
  // `false` counts as offline — this keeps server and client first render in agreement.
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  const { items } = useFolio();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const appendedRef = useRef<string | null>(null);
  const chips = items.length ? items : saved;
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // The server accepts 2,000 characters. Only ever remove the exact line this
  // form appended before — a visitor's own "Pieces:" paragraph is left alone.
  const notePieces = () => {
    const field = messageRef.current;
    if (!field) return;
    const all = [...new Set(chips.map((item) => item.title))];
    if (!all.length) return;
    const shown = all.slice(0, 8);
    const extra = all.length - shown.length;
    const line = `Pieces: ${shown.join(", ")}${extra > 0 ? ` (+${extra} more)` : ""}`;
    let body = field.value;
    if (appendedRef.current) {
      const at = body.lastIndexOf(appendedRef.current);
      if (at >= 0) body = `${body.slice(0, at)}${body.slice(at + appendedRef.current.length)}`;
    }
    const suffix = `\n\n${line}`;
    const room = Math.max(0, 2000 - suffix.length);
    const trimmed = body.trim();
    const kept = trimmed.length > room ? `${trimmed.slice(0, Math.max(0, room - 1)).trimEnd()}…` : trimmed;
    field.value = `${kept}${suffix}`;
    appendedRef.current = suffix;
  };

  if (state.ok) {
    return (
      <div role="status" className="note-card note-done">
        <span className="note-done-dot" aria-hidden="true" />
        <p className="display-wide text-3xl">Thank you — your note is with the studio.</p>
        <p className="type text-tar-soft">{state.message || responseNote || "We will reply by phone or email within a few days."}</p>
        <button type="button" onClick={onSendAnother} className="btn btn-secondary w-fit">
          Send another note
        </button>
        <Honeypot />
        <EventBeacon type="form" productId={productId} />
      </div>
    );
  }

  return (
    <form action={action} className="note-card" onSubmit={notePieces}>
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      {productName ? (
        <p className="f-about">
          About <strong>{productName}</strong>
        </p>
      ) : null}

      <div className="f-row">
        <label htmlFor="note-name">Your name *</label>
        <input id="note-name" name="name" type="text" required maxLength={120} autoComplete="name" />
      </div>
      <div className="f-row">
        <label htmlFor="note-contact">Phone or email *</label>
        <input
          id="note-contact"
          name="contact"
          type="text"
          required
          maxLength={160}
          autoComplete="tel"
          inputMode="text"
          pattern=".*@.*|(.*[0-9].*){7,}"
          title="A phone number or an email address the studio can reply to"
          placeholder="e.g. 610 555 0123 or you@example.com"
        />
      </div>
      <div className="f-row">
        <label htmlFor="note-subject">Subject</label>
        <input
          id="note-subject"
          name="subject"
          type="text"
          defaultValue={productName ? `Asking about ${productName}` : (defaultSubject ?? "A question for the studio")}
        />
      </div>
      <div className="f-row">
        <label htmlFor="note-message">Message *</label>
        <textarea
          id="note-message"
          name="message"
          ref={messageRef}
          required
          maxLength={2000}
          defaultValue={initialMessage ?? (productName ? `I would like to ask about ${productName}.` : "")}
          placeholder="Which piece, or what would you like made — size, wood, where it will live?"
        />
      </div>

      {chips.length ? (
        <div className="f-chips" aria-label="Pieces included in this note">
          {chips.slice(0, 4).map((item) => (
            <span key={item.id} className="f-chip" title={item.title}>
              {item.imageUrl ? <Image src={item.imageUrl} alt="" width={28} height={28} className="object-cover" /> : null}
              <span className="f-chip-title">{item.title}</span>
            </span>
          ))}
          {chips.length > 4 ? <span className="f-chip f-chip-more">+{chips.length - 4} more</span> : null}
        </div>
      ) : null}

      <Honeypot />
      {!online ? (
        <p role="status" className="f-error">
          You appear to be offline. Reconnect to send your note — nothing has been sent yet.
        </p>
      ) : null}
      {state.message ? (
        <p role="alert" className="f-error">
          {state.message}
        </p>
      ) : null}

      <button className="send" type="submit" disabled={pending || !online}>
        {!online ? "Offline" : pending ? "Sending…" : "Send to the studio"}
      </button>
      <p className="fine">Nothing is paid on this site — your note goes straight to the studio.</p>
    </form>
  );
}
