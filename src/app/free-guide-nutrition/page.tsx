import type { Metadata } from "next"
import { FreeGuideNutritionPageD } from "@/components/site/FreeGuideNutritionPageD"

export const metadata: Metadata = {
  title: "Free Nutrition Guide: The 5 Principles That Actually Work",
  description:
    "Stop searching for shortcuts. Here are the 5 science-backed nutrition principles behind every real body transformation: fat loss, muscle, and longevity. Free guide from Lisa Fit Method.",
  openGraph: {
    // Its own card, as a static file. The generated route this replaces
    // overlaid text on a banner that already had branding baked in, so
    // the two collided and the badge was clipped off the left edge.
    images: [{ url: "/og-free-guide-nutrition.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "The 5 Principles That Actually Work — free nutrition guide" }],
    siteName: "Lisa Fit Method",
    type: "article",
    locale: "en_US",
    title: "Free Nutrition Guide — The 5 Principles That Actually Work",
    description: "Stop searching for shortcuts. The 5 science-backed nutrition principles behind every real body transformation. Free from Lisa Fit Method.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Nutrition Guide — The 5 Principles That Actually Work",
    description: "Stop searching for shortcuts. The 5 nutrition principles behind every real body transformation. Free from Lisa Fit Method.",
  },
}

export default function NutritionGuidePage() {
  return <FreeGuideNutritionPageD />
}
