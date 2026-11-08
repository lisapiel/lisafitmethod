import type { Metadata } from "next"
import { Suspense } from "react"
import CheckInsPage from "./page.client"

export const metadata: Metadata = {
  title: "Coaching · Check-ins | Lisa Fit Method Admin",
  description: "Weekly check-ins to review, and who hasn't checked in yet this week.",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <Suspense><CheckInsPage /></Suspense>
}
