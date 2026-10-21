import type { Metadata } from "next"
import { FreeGuidePageD } from "@/components/site/FreeGuidePageD"

export const metadata: Metadata = {
  title: "The 5 Foundation Movements: Free Preview",
  description:
    "Get the five movement patterns every strong body is built on, with exact coaching cues and a real look inside the 4-week program.",
  openGraph: {
    // Its own card, as a static file. The generated route this replaces
    // overlaid text on a banner that already had branding baked in, so
    // the two collided and the badge was clipped off the left edge.
    images: [{ url: "/og-free-guide.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "The 5 Foundation Movements — free training guide" }],
    siteName: "Lisa Fit Method",
    type: "article",
    locale: "en_US",
    title: "Free Training Guide — The 5 Foundation Movements",
    description: "The five movement patterns every strong body is built on. Coaching cues, real programming, and a look inside the 4-week program. Free from Lisa Fit Method.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Training Guide — The 5 Foundation Movements",
    description: "The five movement patterns every strong body is built on. Free from Lisa Fit Method.",
  },
}

export default function FreeGuidePage() {
  return <FreeGuidePageD />
}
