import type { Metadata } from "next"
import GoalsClient from "./page.client"

export const metadata: Metadata = {
  title: "Goals — Lisa Fit Method Coaching",
}

export default function GoalsPage() {
  return <GoalsClient />
}
