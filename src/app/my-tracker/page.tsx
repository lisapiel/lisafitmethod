import type { Metadata } from "next"
import { TrackerPageClient } from "./page.client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "My Workout Tracker | Lisa Fit Method",
  description: "Your personal workout tracker. Build your own program and use it forever.",
}

export default function MyTrackerPage() {
  return <TrackerPageClient />
}
