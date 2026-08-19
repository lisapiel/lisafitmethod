import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { ownsCoachingRaw, ownsTrackerRaw } from "@/lib/authTokens"
import { COACHING_CLIENT_TRACKER_CENTS } from "@/lib/pricing"

export const dynamic = "force-dynamic"

const TRACKER_PRICE_CENTS = 2700

async function getSessionEmail(): Promise<string | null> {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec): Promise<string | null> => {
      try {
        const session = await fetchAuthSession(contextSpec)
        return (session.tokens?.idToken?.payload?.email as string | undefined) ?? null
      } catch {
        return null
      }
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
    const { email } = await request.json() as { email: string }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Duplicate-purchase gate — refuse a new PaymentIntent if the
    // authenticated user already owns the tracker. Uses the raw check so
    // admin auto-grant doesn't accidentally block admin testing (an admin
    // has no tracker_access record unless they've actually bought it).
    const sessionEmail = await getSessionEmail()
    if (sessionEmail) {
      const alreadyOwns = await ownsTrackerRaw(sessionEmail)
      if (alreadyOwns) {
        return NextResponse.json(
          { error: "already-owned", product: "tracker" },
          { status: 409 }
        )
      }
    }

    // Coaching-client eligibility resolved from the authenticated Cognito
    // session — the buyer's typed email is irrelevant for pricing. Admin
    // auto-grant is bypassed via ownsCoachingRaw.
    const coachingClientEligible = sessionEmail != null ? await ownsCoachingRaw(sessionEmail) : false
    const amount = coachingClientEligible ? COACHING_CLIENT_TRACKER_CENTS : TRACKER_PRICE_CENTS

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        customerEmail: email.toLowerCase().trim(),
        product: "tracker",
        coachingClientPrice: coachingClientEligible ? "true" : "false",
      },
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      finalAmount: amount,
      coachingClientPrice: coachingClientEligible,
    })
  } catch (error) {
    console.error("Tracker PaymentIntent error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
