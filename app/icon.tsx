import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#171713",
        color: "#f4f0e7",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <svg
        viewBox="0 0 28 28"
        width="42"
        height="42"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 7.5h14.5a7.5 7.5 0 1 1 0 15H11V4"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="3" cy="7.5" r="2" fill="#d7ff3f" />
      </svg>
    </div>,
    size,
  );
}
