import type { Metadata } from "next"
import PreviewConsoleClient from "./page.client"

// noindex: internal design review surface on the live app's domain.
export const metadata: Metadata = {
  title: "Redesign Prototype — Review Console",
  description: "Internal design prototype review. Not live content.",
  robots: { index: false, follow: false, nocache: true },
}

export default function PreviewConsolePage() {
  return <PreviewConsoleClient />
}
