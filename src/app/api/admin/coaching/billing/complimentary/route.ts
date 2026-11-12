import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { makeComplimentary } from "@/lib/billing/actions"
import { actionResponse, billingDeps, cleanEmail } from "@/lib/billing/server"

export const dynamic = "force-dynamic"

// POST /api/admin/coaching/billing/complimentary
// { email, confirm: { subscriptionId } } — subscriptionId is what the admin
// reviewed (null when nothing changes in Stripe).
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; confirm?: { subscriptionId?: unknown } }
  const email = cleanEmail(body.email)
  if (!email || !body.confirm || !("subscriptionId" in body.confirm)) return NextResponse.json({ ok: false, message: "email and confirm.subscriptionId are required" }, { status: 400 })
  const subscriptionId = typeof body.confirm.subscriptionId === "string" ? body.confirm.subscriptionId : null
  try {
    return actionResponse(await makeComplimentary(billingDeps(), { email, admin, confirm: { subscriptionId } }))
  } catch (e) {
    console.error("make complimentary failed:", e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, message: "Something went wrong before anything could be confirmed. Reload billing to see the current state." }, { status: 500 })
  }
}
