import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
  try {
    const { email } = await request.json() as { email: string }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 50, // TEMP TEST $0.50 — change back to 4500 after testing
      currency: "usd",
      metadata: { customerEmail: email },
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error("PaymentIntent error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
