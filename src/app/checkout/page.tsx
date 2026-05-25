import type { Metadata } from "next"
import { CheckoutClient } from "./page.client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Get Access — Training Foundations | Lisa Fit Method",
  description: "One-time payment. Instant access. Yours forever.",
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
