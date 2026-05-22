import type { Metadata } from "next"
import CoachingClient from "./page.client"

export const metadata: Metadata = {
  title: "Online Coaching — 1:1 with Lisa McPherson",
  description:
    "Work directly with Lisa — a certified personal trainer who's been on both sides of training. Personalized programming, form feedback, and real accountability.",
  openGraph: {
    title: "Online Coaching — 1:1 with Lisa McPherson",
    description: "Work directly with Lisa. Personalized programming, form feedback, and real accountability.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

export default function CoachingPage() {
  return <CoachingClient />
}
