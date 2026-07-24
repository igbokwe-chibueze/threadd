import { ImageResponse } from "next/og";

export const alt = "THREADD — Clothes without categories";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background: "#171713",
        color: "#f4f0e7",
        display: "flex",
        height: "100%",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "#d7ff3f",
          display: "flex",
          width: 64,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          Lagos / Nigeria
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 118,
            fontWeight: 700,
            letterSpacing: -8,
            lineHeight: 0.85,
            textTransform: "uppercase",
          }}
        >
          <span>Thread</span>
          <span style={{ color: "#d7ff3f", marginLeft: 220 }}>D</span>
        </div>
        <div style={{ display: "flex", fontSize: 28 }}>
          Clothes without categories.
        </div>
      </div>
    </div>,
    size,
  );
}
