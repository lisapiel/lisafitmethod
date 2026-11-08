import type { Metadata } from "next"
import ClientsPage from "./page.client"

export const metadata: Metadata = {
  title: "Coaching · Clients | Lisa Fit Method Admin",
  description: "Every coaching client with their program week, training, nutrition and check-in status.",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ClientsPage />
}
