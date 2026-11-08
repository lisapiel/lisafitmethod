import type { Metadata } from "next"
import WorkoutsClient from "./page.client"

export const metadata: Metadata = {
  title: "Workouts | Lisa Fit Method",
  description: "Your program, week by week, with the next workout ready to start.",
}

export default function WorkoutsPage() {
  return <WorkoutsClient />
}
