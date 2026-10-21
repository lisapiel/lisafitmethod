import type { Metadata } from "next"
import { NutritionPageD } from "@/components/site/NutritionPageD"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Nutrition Foundations — Lisa Fit Method",
  description:
    "A 4-week nutrition course for people who train. Personalized TDEE calculator, a science-backed meal plan that adapts to your calorie target, real verified recipes, and habits that stick. One-time payment, ongoing access.",
  openGraph: {
    title: "Nutrition Foundations — Lisa Fit Method",
    description: "A 4-week nutrition course for people who train. $77 one-time, ongoing access.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Lisa Fit Method" }],
  },
}

export default function NutritionPage() {
  return <NutritionPageD />
}
