import type { Metadata } from "next"
import NewBlockClient from "./page.client"

export const metadata: Metadata = { title: "New Block — LFM Admin" }

export default function NewBlockPage() {
  return <NewBlockClient />
}
