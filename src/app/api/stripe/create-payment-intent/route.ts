import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

const BASE_PRICE_CENTS = 4700
const MIN_CHARGE_CENTS = 50

function loadPromoCodes(): Record<string, number> {
  try {
    return JSON.parse(process.env.PROMO_CODES ?? "{}")
  } catch {
    return {}
  }
}

function applyPromo(code: string): { valid: boolean; discountPct: number; finalAmount: number } {
  const codes = loadPromoCodes()
  const normalized = code.trim().toUpperCase()
  if (!(normalized in codes)) return { valid: false, discountPct: 0, finalAmount: BASE_PRICE_CENTS }
  const pct = codes[normalized]
  const discounted = Math.round(BASE_PRICE_CENTS * (1 - pct / 100))
  return { valid: true, discountPct: pct, finalAmount: Math.max(discounted, MIN_CHARGE_CENTS) }
}

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
    const { email, promoCode } = await request.json() as { email: string; promoCode?: string }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    let discountPct = 0
    let finalAmount = BASE_PRICE_CENTS

    if (promoCode?.trim()) {
      const result = applyPromo(promoCode)
      if (!result.valid) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 })
      }
      discountPct = result.discountPct
      finalAmount = result.finalAmount
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      metadata: { customerEmail: email, promoCode: promoCode ?? "", discountPct: String(discountPct) },
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, discountPct, finalAmount })
  } catch (error) {
    console.error("PaymentIntent error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
