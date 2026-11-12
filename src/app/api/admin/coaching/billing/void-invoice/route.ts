import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { voidOutstandingInvoice } from "@/lib/billing/actions"
import { actionResponse, billingDeps, cleanEmail } from "@/lib/billing/server"

export const dynamic = "force-dynamic"

// POST /api/admin/coaching/billing/void-invoice
// { email, invoiceId, amountRemainingCents } — the amount the admin saw.
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; invoiceId?: unknown; amountRemainingCents?: unknown }
  const email = cleanEmail(body.email)
  const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId : ""
  const amount = typeof body.amountRemainingCents === "number" ? body.amountRemainingCents : NaN
  if (!email || !invoiceId.startsWith("in_") || !Number.isInteger(amount)) return NextResponse.json({ ok: false, message: "email, invoiceId and amountRemainingCents are required" }, { status: 400 })
  try {
    return actionResponse(await voidOutstandingInvoice(billingDeps(), { email, admin, invoiceId, confirmAmountCents: amount }))
  } catch (e) {
    console.error("void invoice failed:", e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, message: "Something went wrong before anything could be confirmed. Reload billing to see the current state." }, { status: 500 })
  }
}
