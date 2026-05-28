import type { Metadata } from "next"
import ProgressTrackerPage from "./page.client"

export const metadata: Metadata = {
  title: "My Training Log: Training Foundations",
}

export default function TrackerPage() {
  return <ProgressTrackerPage />
}
