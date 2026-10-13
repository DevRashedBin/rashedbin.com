import { ImageResponse } from "next/og";

export const alt = "Rashed — Website design, development and optimisation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social sharing image, generated at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0b0b0b",
        color: "#f6f5f1",
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background: "#f6f5f1",
            color: "#0b0b0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            fontStyle: "italic",
          }}
        >
          R
        </div>
        Rashed
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 84, lineHeight: 1, letterSpacing: -3, maxWidth: 980 }}>
          Websites that turn visitors into clients.
        </div>
        <div style={{ fontSize: 28, color: "rgba(246,245,241,0.6)" }}>
          Design · Development · SEO · Performance · Maintenance
        </div>
      </div>
    </div>,
    size,
  );
}
