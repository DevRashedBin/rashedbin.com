"use client";

/** Last-resort error UI; replaces the root layout, so it carries its own styles. */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#f6f5f1",
          color: "#0b0b0b",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: 24,
        }}
      >
        <title>Something went wrong | Rashed</title>
        <main style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 36, letterSpacing: "-0.03em", margin: 0 }}>
            Something went wrong.
          </h1>
          <p style={{ color: "#3a3a38", lineHeight: 1.6 }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: "#0b0b0b",
              color: "#f6f5f1",
              border: 0,
              borderRadius: 999,
              padding: "12px 22px",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
