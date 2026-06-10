import type { Metadata } from "next"
import WorkoutLoggerClient from "./page.client"

export const metadata: Metadata = {
  title: "Workout — Lisa Fit Method Coaching",
}

export default function WorkoutPage() {
  return <WorkoutLoggerClient />
}
