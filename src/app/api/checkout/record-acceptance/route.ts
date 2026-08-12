import { NextRequest, NextResponse } from "next/server"
import { recordTermsAcceptance, TERMS_VERSION, LIABILITY_WAIVER_VERSION } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

// POST /api/checkout/record-acceptance
// Called from the checkout page immediately before stripe.confirmPayment(),
// after the customer ticks the required Terms + Refund acceptance checkbox.
// Writes a durable acceptance record tied to the PaymentIntent id, so we can
// later prove which version of the Terms the customer agreed to.
//
// This runs before payment succeeds — payment failures leave the record
// as an "acceptance without payment" (safe: the record proves what they
// clicked, and Stripe records prove whether the charge went through).
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const b = body as { email?: string; product?: string; clientSecret?: string }
  const email = b.email?.trim().toLowerCase() ?? ""
  const product = b.product?.trim() ?? ""
  const clientSecret = b.clientSecret ?? ""

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 })
  }
  if (!product) {
    return NextResponse.json({ error: "product required" }, { status: 400 })
  }

  // Extract PaymentIntent id from the client secret. Format: pi_XXXX_secret_YYYY
  const paymentIntentId = clientSecret.split("_secret_")[0] || undefined

  const forwardedFor = req.headers.get("x-forwarded-for") ?? ""
  const ipAddress = forwardedFor.split(",")[0].trim() || undefined
  const userAgent = req.headers.get("user-agent") ?? undefined

  try {
    await recordTermsAcceptance({
      kind: "course-purchase",
      customerEmail: email,
      product,
      termsVersion: TERMS_VERSION,
      liabilityWaiverVersion: LIABILITY_WAIVER_VERSION,
      stripePaymentIntentId: paymentIntentId,
      ipAddress,
      userAgent,
      termsUrl: "/terms",
      liabilityWaiverUrl: "/terms#risk",
    })
  } catch (err) {
    console.error("recordTermsAcceptance failed:", err)
    // Non-blocking — the customer's payment must not fail because our DB
    // blipped. Stripe metadata + retries in the webhook are the safety net.
  }

  return NextResponse.json({ ok: true })
}
