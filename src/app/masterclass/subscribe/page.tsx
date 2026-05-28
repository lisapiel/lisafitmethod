import type { Metadata } from "next"
import SubscribeClient from "./page.client"

export const metadata: Metadata = {
  title: "Join Masterclass | Lisa Fit Method",
  description: "Monthly programming. Real exercise videos. New block every month.",
}

export default function SubscribePage() {
  return <SubscribeClient />
}
