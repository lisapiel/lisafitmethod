import type { Metadata } from "next"
import ProgressClient from "./page.client"

export const metadata: Metadata = {
  title: "Progress — Lisa Fit Method Coaching",
}

export default function ProgressPage() {
  return <ProgressClient />
}
