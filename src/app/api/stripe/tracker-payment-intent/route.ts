import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

const TRACKER_PRICE_CENTS = 1700

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
    const { email } = await request.json() as { email: string }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: TRACKER_PRICE_CENTS,
      currency: "usd",
      metadata: { customerEmail: email.toLowerCase().trim(), product: "tracker" },
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, finalAmount: TRACKER_PRICE_CENTS })
  } catch (error) {
    console.error("Tracker PaymentIntent error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
