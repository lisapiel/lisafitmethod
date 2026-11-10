import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getCoachingClientRecord } from "@/lib/authTokens"
import { clientSessionEmail } from "@/lib/clientSession"
import { resolveBundleCreditLookup } from "@/lib/bundleCreditAccess"
import { assessBundleCredit } from "@/lib/bundleCreditAssess"
import { creditFormStatus } from "@/lib/bundleCredit"

export const dynamic = "force-dynamic"

// GET /api/coaching/bundle-credit[?email=X]
// Used by the apply form to show a credit banner. Signed-in only and answers
// only for the session's own email, so nobody can check whether another
// person bought a bundle. Runs the same rules as approval and checkout, with
// today as the application date. Stripe is only read, never written.
// Returns { status, amountCents, applyBy, windowDays }.
export async function GET(req: NextRequest) {
  const lookup = resolveBundleCreditLookup(await clientSessionEmail(), req.nextUrl.searchParams.get("email"))
  if (!lookup.ok) {
    return NextResponse.json({ status: "none", amountCents: 0, applyBy: null, windowDays: null }, { status: lookup.status })
  }
  let assessment: Awaited<ReturnType<typeof assessBundleCredit>> | null = null
  try {
    assessment = await assessBundleCredit(
      { stripe: new Stripe(process.env.STRIPE_SECRET_KEY ?? ""), readClient: getCoachingClientRecord },
      { application: { id: null, email: lookup.email, applicationDate: new Date().toISOString() }, commitmentType: null, priceCents: null },
    )
  } catch {
    assessment = null
  }
  if (!assessment) return NextResponse.json({ status: "none", amountCents: 0, applyBy: null, windowDays: null })
  return NextResponse.json({
    status: creditFormStatus(assessment.plan),
    amountCents: assessment.plan.eligibleCreditCents,
    applyBy: assessment.plan.applyBy,
    windowDays: assessment.plan.windowDays,
  })
}
