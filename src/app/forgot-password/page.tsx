import type { Metadata } from "next"
import { ForgotPasswordClient } from "./page.client"

export const metadata: Metadata = {
  title: "Reset Password | Lisa Fit Method",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
