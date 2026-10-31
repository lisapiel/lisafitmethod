import { NextRequest, NextResponse } from "next/server"
import {
  getCoachingApplication,
  recordTermsAcceptance,
  TERMS_VERSION,
  LIABILITY_WAIVER_VERSION,
} from "@/lib/authTokens"
import { getSessionUser } from "@/lib/sessionUser"
import { applicationOwnerEmail, resolveInvitationAccess } from "@/lib/coachingInvitation"
import { prepareCoachingCheckout } from "@/lib/coachingCheckout"

export const dynamic = "force-dynamic"

// Records the two acknowledgements and hands back a payable Stripe URL.
//
// Both halves live here on purpose. The acceptance has to be stored before the
// person can pay, and the session they are sent to has to be one that is
// actually open — the previous split, where acceptance was recorded here and
// the URL came from a field written weeks earlier at approval time, is what
// sent people to an expired checkout.
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const b = body as { applicationId?: string; termsAccepted?: boolean; waiverAccepted?: boolean }
  const applicationId = b.applicationId?.trim() ?? ""
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 })

  // The acknowledgements are a legal record, so they are taken from what the
  // caller actually confirmed rather than assumed from reaching this endpoint.
  if (b.termsAccepted !== true || b.waiverAccepted !== true) {
    return NextResponse.json({ error: "Both acknowledgements are required" }, { status: 400 })
  }

  const application = await getCoachingApplication(applicationId)
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 })
  if (application.status === "DECLINED" || application.status === "PENDING") {
    return NextResponse.json({ error: "This application is not approved for payment" }, { status: 403 })
  }

  const access = await resolveInvitationAccess(application, user)
  if (access !== "owner") {
    return NextResponse.json(
      { error: "This invitation belongs to a different account", access },
      { status: 403 },
    )
  }

  const ownerEmail = applicationOwnerEmail(application)
  const forwardedFor = req.headers.get("x-forwarded-for") ?? ""
  const ipAddress = forwardedFor.split(",")[0].trim() || undefined

  try {
    await recordTermsAcceptance({
      kind: "coaching-subscription",
      customerEmail: ownerEmail,
      product: "coaching",
      coachingOption: application.coachingOption ?? undefined,
      termsVersion: TERMS_VERSION,
      liabilityWaiverVersion: LIABILITY_WAIVER_VERSION,
      applicationId,
      amountCents: application.approvedPriceInCents,
      recurringAmountCents: application.approvedPriceInCents,
      ipAddress,
      userAgent: req.headers.get("user-agent") ?? undefined,
      termsUrl: "/terms#coaching",
      liabilityWaiverUrl: "/terms#risk",
    })
  } catch (err) {
    console.error("recordTermsAcceptance (coaching) failed:", err)
  }

  try {
    const decision = await prepareCoachingCheckout({
      application,
      ownerEmail,
      ownerName: application.name,
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://lisafitmethod.com",
    })
    return NextResponse.json(decision)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("prepareCoachingCheckout failed:", detail)
    return NextResponse.json({ error: "Could not start checkout", detail }, { status: 500 })
  }
}
