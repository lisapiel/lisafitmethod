import type { Metadata } from "next"
import MessagesPage from "./page.client"

export const metadata: Metadata = {
  title: "Coaching · Messages | Lisa Fit Method Admin",
  description: "Client conversations, with the ones waiting for your reply first.",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <MessagesPage />
}
