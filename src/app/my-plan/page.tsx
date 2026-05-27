import type { Metadata } from "next"
import { PlanPageClient } from "./page.client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "90-Day Plan | Lisa Fit Method",
  description: "Your private 90-day business dashboard.",
  robots: { index: false, follow: false },
}

export default function MyPlanPage() {
  return <PlanPageClient />
}
