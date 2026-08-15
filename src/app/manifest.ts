import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lisa Fit Method",
    short_name: "Lisa Fit Method",
    description: "Training, nutrition, and 1:1 coaching from Lisa Fit Method.",
    // Home-Screen launch lands in the coaching portal. Coaching clients start
    // on their Home dashboard; the layout redirects non-coaching visitors to
    // /account, which is the right entry point for course/tracker/masterclass
    // owners and admins.
    start_url: "/my-coaching",
    display: "standalone",
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
