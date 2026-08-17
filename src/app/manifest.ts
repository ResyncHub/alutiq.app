import type { MetadataRoute } from "next";

// Next.js serwuje to automatycznie pod /manifest.webmanifest i linkuje w <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alutiq",
    short_name: "Alutiq",
    description: "System operacyjny serwisu okienno-drzwiowego i automatyki.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0d12",
    theme_color: "#0a0d12",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
