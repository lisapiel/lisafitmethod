import type { Metadata } from "next"
import { CoachingPageD } from "@/components/site/CoachingPageD"

export const metadata: Metadata = {
  title: "Online 1:1 Coaching | Lisa Fit Method",
  description:
    "Personalized 1:1 coaching for people who want to build strength, improve their body composition, move better, and stay consistent. Every program is built around you.",
  openGraph: {
    // Next replaces the parent openGraph rather than merging into it, so a
    // page that sets any field here inherits no image at all. Without this
    // the card is blank, which is the fault this change exists to fix.
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Lisa Fit Method" }],
    siteName: "Lisa Fit Method",
    type: "website",
    locale: "en_US",
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
