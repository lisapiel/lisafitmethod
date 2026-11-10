import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getCoachingApplication, getCoachingClientRecord, listCoachingApplications, type CommitmentType } from "@/lib/authTokens"
import { pickApplicationFor } from "@/lib/intake"
import { buildPaymentSummary } from "@/lib/paymentSummary"

export const dynamic = "force-dynamic"

// GET /api/admin/coaching/payment-summary?email=…[&applicationId=…][&commitment=…][&priceCents=…]
// Read-only. Stripe is only asked to retrieve and list; nothing is created,
// charged or sent from here. Coach only.
export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const q = req.nextUrl.searchParams
  const email = (q.get("email") ?? "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })
  const commitmentParam = q.get("commitment")
  const commitmentType: CommitmentType | null =
    commitmentParam === "THREE_MONTH_MINIMUM" || commitmentParam === "MONTH_TO_MONTH" ? commitmentParam : null
  const priceParam = Number(q.get("priceCents"))
  const priceCents = Number.isFinite(priceParam) && priceParam > 0 ? Math.round(priceParam) : null

  const summary = await buildPaymentSummary(
    {
      stripe: new Stripe(process.env.STRIPE_SECRET_KEY ?? ""),
      readClient: getCoachingClientRecord,
      readApplication: getCoachingApplication,
      latestApplicationFor: async (e) => pickApplicationFor(await listCoachingApplications(), e),
    },
    { email, applicationId: q.get("applicationId"), commitmentType, priceCents },
  )
  if (!summary) return NextResponse.json({ error: "Application not found" }, { status: 404 })
  return NextResponse.json({ summary })
}
