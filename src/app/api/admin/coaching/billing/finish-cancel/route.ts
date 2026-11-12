import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getCoachingClientRecord } from "@/lib/authTokens"
import { runClientCancellation } from "@/lib/billing/clientCancelFlow"
import { cleanEmail } from "@/lib/billing/server"

export const dynamic = "force-dynamic"

// POST /api/admin/coaching/billing/finish-cancel  { email }
// Finishes a client's own cancellation request that couldn't be confirmed when
// they made it (for example, their commitment hadn't been confirmed yet).
// Runs exactly what the client's request runs: the same end-date rules, the
// same single confirmation email. Only for a request the client actually made.
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { email?: unknown }
  const email = cleanEmail(body.email)
  if (!email) return NextResponse.json({ ok: false, message: "email is required" }, { status: 400 })
  const client = await getCoachingClientRecord(email)
  if (!client?.cancellationRequestedAt) return NextResponse.json({ ok: false, message: "This client hasn't asked to cancel." }, { status: 409 })
  try {
    const r = await runClientCancellation(email, { requestedBy: admin })
    if (r.status === 200) return NextResponse.json({ ok: true, message: `Cancellation confirmed. Coaching ends ${String(r.body.effectiveDate ?? "").slice(0, 10)}; the client has been emailed.` })
    return NextResponse.json({ ok: false, message: r.status === 202 ? "The end date still can't be confirmed. Check the reason above, sort it out, then try again." : String(r.body.error ?? "Not finished.") }, { status: r.status === 202 ? 409 : r.status })
  } catch (e) {
    console.error("finish-cancel failed:", e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, message: "Something went wrong before it finished. Reload billing to see the current state." }, { status: 500 })
  }
}
