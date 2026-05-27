import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getPromoCodes } from "@/lib/promoCodes"

export const dynamic = "force-dynamic"

const BASE_PRICE_CENTS = 4700
const TRACKER_PRICE_CENTS = 1700
const MIN_CHARGE_CENTS = 50

async function applyPromo(code: string): Promise<{ valid: boolean; discountPct: number; finalAmount: number }> {
  const codes = await getPromoCodes()
  const normalized = code.trim().toUpperCase()
  const entry = codes[normalized]
  if (!entry || !entry.active) return { valid: false, discountPct: 0, finalAmount: BASE_PRICE_CENTS }
  const discounted = Math.round(BASE_PRICE_CENTS * (1 - entry.discountPct / 100))
  return { valid: true, discountPct: entry.discountPct, finalAmount: Math.max(discounted, MIN_CHARGE_CENTS) }
}

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
    const { email, name, promoCode, includesTracker } = await request.json() as {
      email: string
      name?: string
      promoCode?: string
      includesTracker?: boolean
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    let discountPct = 0
    let courseAmount = BASE_PRICE_CENTS

    if (promoCode?.trim()) {
      const result = await applyPromo(promoCode)
      if (!result.valid) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 })
      }
      discountPct = result.discountPct
      courseAmount = result.finalAmount
    }

    const finalAmount = courseAmount + (includesTracker ? TRACKER_PRICE_CENTS : 0)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      metadata: {
        customerEmail: email,
        customerName: name ?? "",
        promoCode: promoCode ?? "",
        discountPct: String(discountPct),
        includesTracker: includesTracker ? "true" : "false",
      },
      payment_method_types: ["card", "link", "affirm", "cashapp"],
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, discountPct, finalAmount })
  } catch (error) {
    console.error("PaymentIntent error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
