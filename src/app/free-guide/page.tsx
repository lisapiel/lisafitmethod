import { Suspense } from "react"
import type { Metadata } from "next"
import FreeGuideClient from "./page.client"

export const metadata: Metadata = {
  title: "The 5 Foundation Movements — Free Preview",
  description:
    "Get the five movement patterns every strong body is built on, with exact coaching cues and a real look inside the 4-week program.",
}

export default function FreeGuidePage() {
  return (
    <Suspense>
      <FreeGuideClient />
    </Suspense>
  )
}
