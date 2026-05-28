import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getPromoCodes } from "@/lib/promoCodes"
import { hasTrainingAccess, hasNutritionAccess } from "@/lib/authTokens"
import { NUTRITION_COURSE_PRICE_CENTS, BUNDLE_PRICE_CENTS } from "@/lib/pricing"

export const dynamic = "force-dynamic"

const TRAINING_BASE_PRICE_CENTS = 9700
const TRACKER_PRICE_CENTS = 2700
const MIN_CHARGE_CENTS = 50

async function applyPromo(
  code: string,
  basePrice: number,
  productType: "training" | "nutrition" | "bundle"
): Promise<{ valid: boolean; discountPct: number; finalAmount: number }> {
  const codes = await getPromoCodes()
  const normalized = code.trim().toUpperCase()
  const entry = codes[normalized]
  if (!entry || !entry.active) return { valid: false, discountPct: 0, finalAmount: basePrice }
  // Check product scope: "all" codes apply everywhere; product-specific codes must match
  const scope = entry.product ?? "all"
  if (scope !== "all") {
    const matches =
      (scope === "training" && (productType === "training" || productType === "bundle")) ||
      (scope === "nutrition" && (productType === "nutrition" || productType === "bundle"))
    if (!matches) return { valid: false, discountPct: 0, finalAmount: basePrice }
  }
  const discounted = Math.round(basePrice * (1 - entry.discountPct / 100))
  return { valid: true, discountPct: entry.discountPct, finalAmount: Math.max(discounted, MIN_CHARGE_CENTS) }
}

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
    const { email, name, promoCode, includesTracker, product, memberDiscount } = await request.json() as {
      email: string
      name?: string
      promoCode?: string
      includesTracker?: boolean
      product?: "training" | "nutrition" | "bundle"
      memberDiscount?: boolean
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const isNutrition = product === "nutrition"
    const isBundle = product === "bundle"
    const basePrice = isBundle ? BUNDLE_PRICE_CENTS : isNutrition ? NUTRITION_COURSE_PRICE_CENTS : TRAINING_BASE_PRICE_CENTS

    let discountPct = 0
    let courseAmount = basePrice

    if (promoCode?.trim()) {
      const result = await applyPromo(promoCode, basePrice, isBundle ? "bundle" : isNutrition ? "nutrition" : "training")
      if (!result.valid) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 })
      }
      discountPct = result.discountPct
      courseAmount = result.finalAmount
    } else if (memberDiscount) {
      // Verify the email actually owns at least one product before granting member discount
      const [hasTrain, hasNutr] = await Promise.all([hasTrainingAccess(email), hasNutritionAccess(email)])
      if (hasTrain || hasNutr) {
        discountPct = 10
        courseAmount = Math.max(Math.round(basePrice * 0.9), MIN_CHARGE_CENTS)
      }
    }

    const finalAmount = courseAmount + (!isNutrition && !isBundle && includesTracker ? TRACKER_PRICE_CENTS : 0)

    // Affirm minimum is $50 (5000 cents); Cash App minimum is $1 (100 cents)
    const paymentMethods: string[] = ["card", "link"]
    if (finalAmount >= 5000) paymentMethods.push("affirm")
    if (finalAmount >= 100) paymentMethods.push("cashapp")

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      metadata: {
        customerEmail: email,
        customerName: name ?? "",
        promoCode: promoCode ?? "",
        discountPct: String(discountPct),
        memberDiscount: memberDiscount ? "true" : "false",
        includesTracker: (!isNutrition && !isBundle && includesTracker) ? "true" : "false",
        product: isBundle ? "bundle" : isNutrition ? "nutrition" : "training",
      },
      payment_method_types: paymentMethods as Stripe.PaymentIntentCreateParams["payment_method_types"],
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, discountPct, finalAmount })
  } catch (error) {
    console.error("PaymentIntent error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
