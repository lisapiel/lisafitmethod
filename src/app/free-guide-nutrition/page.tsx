import { Suspense } from "react"
import type { Metadata } from "next"
import NutritionGuideClient from "./page.client"

export const metadata: Metadata = {
  title: "Free Nutrition Guide: The 5 Principles That Actually Work",
  description:
    "Stop searching for shortcuts. Here are the 5 science-backed nutrition principles behind every real body transformation: fat loss, muscle, and longevity. Free guide from Lisa Fit Method.",
  openGraph: {
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
  return (
    <Suspense>
      <NutritionGuideClient />
    </Suspense>
  )
}
