import type { Metadata } from "next"
import { SetPasswordClient } from "./page.client"

export const metadata: Metadata = { title: "Set Your Password — Lisa Fit Method" }

export default function SetPasswordPage() {
  return <SetPasswordClient />
}
