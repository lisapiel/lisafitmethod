import type { Metadata } from "next"
import SetupClient from "./page.client"

export const metadata: Metadata = {
  title: "Set up your nutrition profile — Lisa Fit Method",
  robots: "noindex, nofollow",
}

export default function SetupPage() {
  return <SetupClient />
}
