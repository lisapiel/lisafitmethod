import { Suspense } from "react"
import type { Metadata } from "next"
import FreeGuideClient from "./page.client"

export const metadata: Metadata = {
  title: "The 5 Foundation Movements: Free Preview",
  description:
    "Get the five movement patterns every strong body is built on, with exact coaching cues and a real look inside the 4-week program.",
  openGraph: {
    title: "Free Training Guide — The 5 Foundation Movements",
    description: "The five movement patterns every strong body is built on. Coaching cues, real programming, and a look inside the 4-week program. Free from Lisa Fit Method.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Training Guide — The 5 Foundation Movements",
    description: "The five movement patterns every strong body is built on. Free from Lisa Fit Method.",
    images: ["/hero.png"],
  },
}

export default function FreeGuidePage() {
  return (
    <Suspense>
      <FreeGuideClient />
    </Suspense>
  )
}
