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
      <div role="status" className="grid gap-4 rounded-[2px] border border-line bg-surface-low p-7 md:p-9">
        <span className="inline-block size-3.5 rounded-full bg-ok" aria-hidden="true" />
        <p className="disp text-2xl text-tar md:text-3xl">Thank you — your note is with the studio.</p>
        <p className="type text-base text-tar-soft">
          {state.message || responseNote || "We will reply by phone or email within a few days."}
        </p>
        <button type="button" onClick={onSendAnother} className="btn btn-secondary mt-2 w-fit">
          Send another note
        </button>
        <Honeypot />
        <EventBeacon type="form" productId={productId} />
      </div>
    );
  }

  return (
    <form
      action={action}
      onSubmit={notePieces}
      className="flex flex-col gap-5 rounded-[2px] border border-line bg-surface-low p-6 md:p-8"
    >
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      {productName ? (
        <p className="ledger border-b border-line pb-3 text-xs text-tar-soft">
          ABOUT: <strong className="text-tar">{productName}</strong>
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="note-name" className="micro-label text-tar">
            Your name *
          </label>
          <input
            id="note-name"
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Your full name"
            className="h-11 w-full rounded-[2px] border border-line-strong bg-wall px-3.5 text-base text-tar outline-none transition-colors placeholder:text-tar-soft/75 focus:border-sap focus:ring-1 focus:ring-sap"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="note-contact" className="micro-label text-tar">
            Phone or email *
          </label>
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
            placeholder="610 555 0123 or you@example.com"
            className="h-11 w-full rounded-[2px] border border-line-strong bg-wall px-3.5 text-base text-tar outline-none transition-colors placeholder:text-tar-soft/75 focus:border-sap focus:ring-1 focus:ring-sap"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-subject" className="micro-label text-tar">
          Piece of interest / Subject
        </label>
        <input
          id="note-subject"
          name="subject"
          type="text"
          defaultValue={productName ? `Asking about ${productName}` : (defaultSubject ?? "A question for the studio")}
          className="h-11 w-full rounded-[2px] border border-line-strong bg-wall px-3.5 text-base text-tar outline-none transition-colors placeholder:text-tar-soft/75 focus:border-sap focus:ring-1 focus:ring-sap"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-message" className="micro-label text-tar">
          Your note *
        </label>
        <textarea
          id="note-message"
          name="message"
          ref={messageRef}
          required
          rows={4}
          maxLength={2000}
          defaultValue={initialMessage ?? (productName ? `I would like to ask about ${productName}.` : "")}
          placeholder="Tell us which piece caught your eye, or what you would like made — size, wood, where it will live."
          className="min-h-28 w-full resize-y rounded-[2px] border border-line-strong bg-wall p-3.5 text-base text-tar outline-none transition-colors placeholder:text-tar-soft/75 focus:border-sap focus:ring-1 focus:ring-sap"
        />
      </div>

      {chips.length ? (
        <div className="f-chips" aria-label="Pieces included in this note">
          {chips.slice(0, 4).map((item) => (
            <span key={item.id} className="f-chip rounded-[2px] bg-wall" title={item.title}>
              {item.imageUrl ? <Image src={item.imageUrl} alt="" width={28} height={28} className="object-cover" /> : null}
              <span className="f-chip-title">{item.title}</span>
            </span>
          ))}
          {chips.length > 4 ? <span className="f-chip f-chip-more rounded-[2px] bg-wall">+{chips.length - 4} more</span> : null}
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

      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <button
          className="ledger inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[2px] bg-tar px-6 text-xs font-bold uppercase tracking-wider text-wall transition-colors hover:bg-sap disabled:cursor-default disabled:opacity-60"
          type="submit"
          disabled={pending || !online}
        >
          {!online ? "Offline" : pending ? "Sending…" : "Send a note →"}
        </button>
        <p className="ledger text-xs text-tar-soft">No online payment. Direct correspondence only.</p>
      </div>
    </form>
  );
}
