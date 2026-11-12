import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { recordPaid } from "@/lib/billing/actions"
import { actionResponse, billingDeps, cleanEmail } from "@/lib/billing/server"

export const dynamic = "force-dynamic"

// POST /api/admin/coaching/billing/record-paid { email } — recovery only, when
// this client is marked complimentary but Stripe is collecting. No Stripe call.
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { email?: unknown }
  const email = cleanEmail(body.email)
  if (!email) return NextResponse.json({ ok: false, message: "email is required" }, { status: 400 })
  try {
    return actionResponse(await recordPaid(billingDeps(), { email, admin }))
  } catch (e) {
    console.error("record paid failed:", e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, message: "Something went wrong. Reload billing to see the current state." }, { status: 500 })
  }
}
