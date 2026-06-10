import type { Metadata } from "next"
import MessagesClient from "./page.client"

export const metadata: Metadata = {
  title: "Messages — Lisa Fit Method Coaching",
}

export default function MessagesPage() {
  return <MessagesClient />
}
