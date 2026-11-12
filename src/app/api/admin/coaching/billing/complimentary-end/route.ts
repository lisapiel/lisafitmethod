import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { endComplimentary, setComplimentaryEnd } from "@/lib/billing/actions"
import { actionResponse, billingDeps, cleanEmail } from "@/lib/billing/server"

export const dynamic = "force-dynamic"

// POST /api/admin/coaching/billing/complimentary-end
//   { email, action: "set-end-date", endsAt }  endsAt YYYY-MM-DD, or empty for no end date
//   { email, action: "end-now", note }         ends complimentary coaching now
// Neither touches Stripe, and neither resumes paid billing.
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; action?: unknown; endsAt?: unknown; note?: unknown }
  const email = cleanEmail(body.email)
  if (!email) return NextResponse.json({ ok: false, message: "email is required" }, { status: 400 })
  try {
    if (body.action === "set-end-date") {
      const endsAt = typeof body.endsAt === "string" && body.endsAt ? body.endsAt : null
      return actionResponse(await setComplimentaryEnd(billingDeps(), { email, admin, endsAt }))
    }
    if (body.action === "end-now") {
      return actionResponse(await endComplimentary(billingDeps(), { email, admin, note: typeof body.note === "string" ? body.note : "" }))
    }
    return NextResponse.json({ ok: false, message: "action must be set-end-date or end-now" }, { status: 400 })
  } catch (e) {
    console.error("complimentary end change failed:", e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, message: "Something went wrong before the change was saved. Reload billing to see the current state." }, { status: 500 })
  }
}
