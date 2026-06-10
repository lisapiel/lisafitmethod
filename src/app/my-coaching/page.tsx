import type { Metadata } from "next"
import MyCoachingHomeClient from "./page.client"

export const metadata: Metadata = {
  title: "My Coaching — Lisa Fit Method",
}

export default function MyCoachingHome() {
  return <MyCoachingHomeClient />
}
