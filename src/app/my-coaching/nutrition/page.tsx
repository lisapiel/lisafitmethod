import type { Metadata } from "next"
import NutritionClient from "./page.client"

export const metadata: Metadata = {
  title: "Nutrition — Lisa Fit Method Coaching",
  robots: "noindex, nofollow",
}

export default function NutritionPage() {
  return <NutritionClient />
}
