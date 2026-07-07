import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lisa Fit Method — Coaching",
    short_name: "LFM Coaching",
    description: "1:1 coaching admin and client portal for Lisa Fit Method.",
    // start_url is where the app opens after install. Admin folks want the
    // coaching dashboard immediately, so send Lisa there — regular clients
    // are redirected to /account or /my-coaching by their auth layout so
    // this doesn't hurt them.
    start_url: "/admin/coaching",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    categories: ["fitness", "health", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
