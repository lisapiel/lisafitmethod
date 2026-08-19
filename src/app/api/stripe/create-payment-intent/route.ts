import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { getPromoCodes } from "@/lib/promoCodes"
import {
  hasTrainingAccess, hasNutritionAccess,
  ownsCoachingRaw, ownsTrainingRaw, ownsNutritionRaw, ownsTrackerRaw,
} from "@/lib/authTokens"
import {
  NUTRITION_COURSE_PRICE_CENTS,
  BUNDLE_PRICE_CENTS,
  COACHING_CLIENT_TRAINING_CENTS,
  COACHING_CLIENT_NUTRITION_CENTS,
  COACHING_CLIENT_TRACKER_CENTS,
} from "@/lib/pricing"

export const dynamic = "force-dynamic"

const TRAINING_BASE_PRICE_CENTS = 9700
const TRACKER_PRICE_CENTS = 2700
const MIN_CHARGE_CENTS = 50

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

    const sessionEmail = await getSessionEmail()

    // ── Duplicate-purchase gate ───────────────────────────────────────────
    // Refuse to create a PaymentIntent for a product the authenticated user
    // already owns. Bundle is intentionally exempt — a bundle purchase may
    // legitimately happen for someone who already owns Training or Nutrition
    // individually (e.g. to earn the $137 coaching credit). Ownership is
    // resolved via raw checks that skip the admin auto-grant.
    if (sessionEmail && !isBundle) {
      const alreadyOwns = isNutrition
        ? await ownsNutritionRaw(sessionEmail)
        : await ownsTrainingRaw(sessionEmail)
      if (alreadyOwns) {
        return NextResponse.json(
          { error: "already-owned", product: isNutrition ? "nutrition" : "training" },
          { status: 409 }
        )
      }
    }
    // The tracker add-on can't be purchased separately here — same protection.
    if (sessionEmail && includesTracker && !isNutrition && !isBundle) {
      const alreadyOwnsTracker = await ownsTrackerRaw(sessionEmail)
      if (alreadyOwnsTracker) {
        return NextResponse.json(
          { error: "already-owned", product: "tracker" },
          { status: 409 }
        )
      }
    }

    // ── Coaching-client pricing eligibility ──────────────────────────────
    // Determined SERVER-SIDE from the authenticated Cognito session, never
    // from anything the client sends. Admin auto-grant is deliberately
    // bypassed (ownsCoachingRaw). The Bundle is excluded per business rule.
    const coachingClientEligible = sessionEmail != null && !isBundle
      ? await ownsCoachingRaw(sessionEmail)
      : false

    const regularBasePrice = isBundle ? BUNDLE_PRICE_CENTS : isNutrition ? NUTRITION_COURSE_PRICE_CENTS : TRAINING_BASE_PRICE_CENTS
    // Effective base price. Client price wins when eligible and is mutually
    // exclusive with promo/member (same pattern the existing else-if between
    // promo and member already enforces). Bundle is never eligible.
    const useClientPrice = coachingClientEligible && !isBundle
    const clientBasePrice = isNutrition ? COACHING_CLIENT_NUTRITION_CENTS : COACHING_CLIENT_TRAINING_CENTS
    const basePrice = useClientPrice ? clientBasePrice : regularBasePrice

    let discountPct = 0
    let courseAmount = basePrice

    if (useClientPrice) {
      // No stacking: promo codes + member discount are silently ignored on
      // the coaching-client path. The client price is already the promo.
      discountPct = Math.round(((regularBasePrice - clientBasePrice) / regularBasePrice) * 100)
    } else if (promoCode?.trim()) {
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

    // Tracker add-on: also gets client pricing when the buyer is an eligible
    // coaching client. Bundle checkouts never carry a tracker add-on.
    const trackerAddOnCents = useClientPrice ? COACHING_CLIENT_TRACKER_CENTS : TRACKER_PRICE_CENTS
    const finalAmount = courseAmount + (!isNutrition && !isBundle && includesTracker ? trackerAddOnCents : 0)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        customerEmail: email,
        customerName: name ?? "",
        promoCode: useClientPrice ? "" : (promoCode ?? ""),
        discountPct: String(discountPct),
        memberDiscount: !useClientPrice && memberDiscount ? "true" : "false",
        coachingClientPrice: useClientPrice ? "true" : "false",
        includesTracker: (!isNutrition && !isBundle && includesTracker) ? "true" : "false",
        product: isBundle ? "bundle" : isNutrition ? "nutrition" : "training",
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      discountPct,
      finalAmount,
      coachingClientPrice: useClientPrice,
    })
  } catch (error) {
    console.error("PaymentIntent error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
