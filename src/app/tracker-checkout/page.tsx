import type { Metadata } from "next"
import { TrackerCheckoutClient } from "./page.client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Get the Lifetime Workout Tracker | Lisa Fit Method",
  description: "A build-your-own workout tracker you keep forever. $17 one-time.",
}

export default function TrackerCheckoutPage() {
  return <TrackerCheckoutClient />
}
