import type { Metadata } from "next"
import CoachingToday from "./page.client"

export const metadata: Metadata = {
  title: "Coaching · Today | Lisa Fit Method Admin",
  description: "Active clients, their week so far, and what needs your attention today.",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CoachingToday />
}
