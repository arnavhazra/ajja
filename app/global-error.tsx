"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#f3ede2",
          color: "#221b15",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <main style={{ maxWidth: "560px", width: "100%", textAlign: "center" }}>
          <p style={{ fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#5c5044", margin: 0 }}>
            Studio interruption
          </p>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 42px)", lineHeight: 1.15, margin: "12px 0 16px", fontWeight: 700, color: "#221b15" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "18px", lineHeight: 1.6, color: "#454038", margin: "0 0 32px" }}>
            The studio hit an unexpected snag while loading this page. Your saved items and pieces are safe.
            Please try again, or return to the main index.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{
                minHeight: "56px",
                padding: "0 28px",
                fontSize: "17px",
                fontWeight: 600,
                backgroundColor: "#221b15",
                color: "#f3ede2",
                border: "1px solid #221b15",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "56px",
                padding: "0 28px",
                fontSize: "17px",
                fontWeight: 600,
                backgroundColor: "transparent",
                color: "#221b15",
                border: "1px solid #221b15",
                borderRadius: "4px",
                textDecoration: "none",
              }}
            >
              Back to index
            </Link>
          </div>
          {error?.digest ? (
            <p style={{ marginTop: "32px", fontSize: "13px", color: "#7a6e60" }}>
              Reference code: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
