import { NextRequest, NextResponse } from "next/server"
import {
  getCoachingApplication,
  recordTermsAcceptance,
  TERMS_VERSION,
  LIABILITY_WAIVER_VERSION,
} from "@/lib/authTokens"

export const dynamic = "force-dynamic"

// POST /api/coaching/record-acceptance
// Called from /coaching/accept/[id] AFTER the applicant ticks both required
// acknowledgements (Coaching T&Cs + Assumption of Risk / Liability Waiver)
// and clicks Continue. Records a durable acceptance row tied to the
// application id, then the interstitial page redirects the browser to the
// Stripe hosted checkout URL.
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const b = body as { applicationId?: string; coachingOption?: string }
  const applicationId = b.applicationId?.trim() ?? ""
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId required" }, { status: 400 })
  }

  const app = await getCoachingApplication(applicationId)
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 })
  if (app.status !== "APPROVED" || !app.stripeCheckoutUrl) {
    return NextResponse.json({ error: "Application is not eligible to proceed to payment" }, { status: 400 })
  }

  const forwardedFor = req.headers.get("x-forwarded-for") ?? ""
  const ipAddress = forwardedFor.split(",")[0].trim() || undefined
  const userAgent = req.headers.get("user-agent") ?? undefined

  try {
    await recordTermsAcceptance({
      kind: "coaching-subscription",
      customerEmail: app.email,
      product: "coaching",
      coachingOption: b.coachingOption ?? app.coachingOption ?? undefined,
      termsVersion: TERMS_VERSION,
      liabilityWaiverVersion: LIABILITY_WAIVER_VERSION,
      applicationId,
      ipAddress,
      userAgent,
      termsUrl: "/terms#coaching",
      liabilityWaiverUrl: "/terms#risk",
    })
  } catch (err) {
    console.error("recordTermsAcceptance (coaching) failed:", err)
    // Don't block the applicant from paying if our DB blipped — the
    // acceptance was legitimately given; we retry on the webhook side.
  }

  return NextResponse.json({ ok: true })
}
