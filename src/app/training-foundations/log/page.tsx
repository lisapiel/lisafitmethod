import { Metadata } from "next"
import WeeklyLogClient from "./page.client"

export const metadata: Metadata = {
  title: "Weekly Log: Training Foundations",
  description: "Log all three days for any week of the program in one place.",
}

export default function LogPage() {
  return <WeeklyLogClient />
}
