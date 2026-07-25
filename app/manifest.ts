import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "THREADD — Clothes without categories",
    short_name: "THREADD",
    description:
      "A modern Nigerian unisex fashion store for clothes without categories.",
    start_url: "/",
    display: "standalone",
    background_color: "#ece8df",
    theme_color: "#171713",
    icons: [{ src: "/icon", sizes: "64x64", type: "image/png" }],
  };
}
