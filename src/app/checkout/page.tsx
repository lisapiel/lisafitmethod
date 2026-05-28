import type { Metadata } from "next"
import { CheckoutClient } from "./page.client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ product?: string }> }): Promise<Metadata> {
  const { product } = await searchParams
  if (product === "nutrition") {
    return {
      title: "Get Access — Nutrition Foundations | Lisa Fit Method",
      description: "One-time payment. Instant access. Yours forever.",
    }
  }
  return {
    title: "Get Access — Training Foundations | Lisa Fit Method",
    description: "One-time payment. Instant access. Yours forever.",
  }
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams
  return <CheckoutClient product={product === "nutrition" ? "nutrition" : "training"} />
}
