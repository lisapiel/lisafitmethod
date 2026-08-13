import { NextRequest, NextResponse } from "next/server"
import {
  getCoachingApplication,
  updateCoachingApplication,
  recordTermsAcceptance,
  TERMS_VERSION,
  LIABILITY_WAIVER_VERSION,
  type CommitmentType,
} from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const b = body as {
    applicationId?: string
    coachingOption?: string
    approvedPriceInCents?: number
    approvedCommitmentType?: CommitmentType
  }
  const applicationId = b.applicationId?.trim() ?? ""
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId required" }, { status: 400 })
  }

  const app = await getCoachingApplication(applicationId)
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 })
  if (app.status !== "APPROVED" || !app.stripeCheckoutUrl) {
    return NextResponse.json({ error: "Application is not eligible to proceed to payment" }, { status: 400 })
  }

  // Prefer values passed by the client (which came from the server page render)
  // over whatever is on the application record, since the page props are authoritative.
  const resolvedPrice = b.approvedPriceInCents ?? app.approvedPriceInCents
  const resolvedCommitment = b.approvedCommitmentType ?? app.approvedCommitmentType

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
      // Approved business terms — the legally disclosed amounts/commitment
      amountCents: resolvedPrice,
      recurringAmountCents: resolvedPrice,
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

  // Store the accepted commitment on the application record as a durable note
  // (non-fatal if this fails — the acceptance record above is primary)
  if (resolvedCommitment) {
    try {
      await updateCoachingApplication(applicationId, {
        approvedCommitmentType: resolvedCommitment,
        ...(resolvedPrice ? { approvedPriceInCents: resolvedPrice } : {}),
      })
    } catch (err) {
      console.error("updateCoachingApplication commitment stamp failed:", err)
    }
  }

  return NextResponse.json({ ok: true })
}
