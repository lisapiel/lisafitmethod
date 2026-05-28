import { Suspense } from "react"
import type { Metadata } from "next"
import NutritionGuideClient from "./page.client"

export const metadata: Metadata = {
  title: "Free Nutrition Guide — The 5 Principles That Actually Work",
  description:
    "Stop searching for shortcuts. Here are the 5 science-backed nutrition principles behind every real body transformation — fat loss, muscle, and longevity. Free guide from Lisa Fit Method.",
}

export default function NutritionGuidePage() {
  return (
    <Suspense>
      <NutritionGuideClient />
    </Suspense>
  )
}
