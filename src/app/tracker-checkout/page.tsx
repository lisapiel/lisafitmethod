import type { Metadata } from "next"
import { TrackerCheckoutClient } from "./page.client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Get the Workout Tracker | Lisa Fit Method",
  description: "A build-your-own workout tracker. One-time purchase, $27.",
}

export default function TrackerCheckoutPage() {
  return <TrackerCheckoutClient />
}
