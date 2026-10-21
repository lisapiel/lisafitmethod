import type { Metadata } from "next"
import { CoachingPageD } from "@/components/site/CoachingPageD"

export const metadata: Metadata = {
  title: "Online 1:1 Coaching | Lisa Fit Method",
  description:
    "Personalized 1:1 coaching for people who want to build strength, improve their body composition, move better, and stay consistent. Every program is built around you.",
  openGraph: {
    title: "Online 1:1 Coaching | Lisa Fit Method",
    description:
      "Personalized 1:1 coaching for people who want to build strength, improve their body composition, move better, and stay consistent.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online 1:1 Coaching | Lisa Fit Method",
    description:
      "Personalized 1:1 coaching for people who want to build strength, improve their body composition, move better, and stay consistent.",
  },
}

export default function CoachingPage() {
  return <CoachingPageD />
}
