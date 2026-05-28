import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

function priceIdForPlan(plan: string): string {
  if (plan === "6month") return process.env.STRIPE_MASTERCLASS_6MONTH_PRICE_ID ?? ""
  if (plan === "annual") return process.env.STRIPE_MASTERCLASS_ANNUAL_PRICE_ID ?? ""
  return process.env.STRIPE_MASTERCLASS_MONTHLY_PRICE_ID ?? ""
}

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
    const { email, name, plan } = await request.json() as {
      email: string
      name?: string
      plan: "monthly" | "6month" | "annual"
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const priceId = priceIdForPlan(plan)
    if (!priceId) {
      return NextResponse.json({ error: "Subscription pricing not configured" }, { status: 500 })
    }

    // Find or create a Stripe Customer for this email
    const existing = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 })
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({
          email: email.toLowerCase(),
          name: name ?? undefined,
          metadata: { source: "lisafitmethod" },
        })

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        product: "masterclass",
        plan,
        customerEmail: email.toLowerCase(),
        customerName: name ?? "",
      },
    })

    const invoice = subscription.latest_invoice as unknown as { payment_intent?: { client_secret: string | null } }
    const paymentIntent = invoice.payment_intent

    if (!paymentIntent?.client_secret) {
      return NextResponse.json({ error: "Failed to get payment details" }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error("Create subscription error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
