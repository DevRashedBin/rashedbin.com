import { Fragment } from "react";

/**
 * Renders text where *wrapped* words are set in the serif accent.
 * Content is plain text from trusted content files; no HTML is parsed.
 */
export function Emphasis({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <em key={i} className="accent">
            {part.slice(1, -1)}
          </em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Plain-text version for metadata and aria labels. */
export function stripEmphasis(text: string): string {
  return text.replace(/\*/g, "");
}
