import type { Metadata } from "next"
import { CheckoutClient } from "./page.client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ product?: string }> }): Promise<Metadata> {
  const { product } = await searchParams
  if (product === "nutrition") {
    return { title: "Get Access — Nutrition Foundations | Lisa Fit Method", description: "One-time payment. Instant access. Yours to keep." }
  }
  if (product === "bundle") {
    return { title: "Get Access — Foundations Bundle | Lisa Fit Method", description: "Both courses. One price. Yours to keep." }
  }
  return { title: "Get Access — Training Foundations | Lisa Fit Method", description: "One-time payment. Instant access. Yours to keep." }
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string; member?: string }> }) {
  const { product, member } = await searchParams
  const validProduct = product === "nutrition" ? "nutrition" : product === "bundle" ? "bundle" : "training"
  return <CheckoutClient product={validProduct} memberDiscount={member === "1"} />
}
