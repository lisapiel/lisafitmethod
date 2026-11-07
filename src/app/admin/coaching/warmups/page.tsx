import type { Metadata } from "next"
import WarmupReviewClient from "./page.client"

export const metadata: Metadata = {
  title: "Warm-up Review | Lisa Fit Method Admin",
  description: "Review and apply missing warm-ups and cool-downs in existing programs.",
}

export default function WarmupReviewPage() {
  return <WarmupReviewClient />
}
