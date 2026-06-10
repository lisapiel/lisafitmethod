import type { Metadata } from "next"
import CheckInClient from "./page.client"

export const metadata: Metadata = {
  title: "Weekly Check-In — Lisa Fit Method Coaching",
}

export default function CheckInPage() {
  return <CheckInClient />
}
