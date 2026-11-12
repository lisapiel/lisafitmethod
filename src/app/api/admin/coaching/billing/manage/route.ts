import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { manageView } from "@/lib/billing/actions"
import { billingDeps, cleanEmail } from "@/lib/billing/server"

export const dynamic = "force-dynamic"

// GET /api/admin/coaching/billing/manage?email=… — what is actually being
// collected, what each action would do, outstanding invoices and history.
// Finishes any change that was interrupted, by reading Stripe.
export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = cleanEmail(req.nextUrl.searchParams.get("email"))
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })
  try {
    return NextResponse.json({ ok: true, view: await manageView(billingDeps(), email) })
  } catch (e) {
    console.error("billing manage view failed:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Billing couldn't be loaded from Stripe. Nothing was changed. Try again in a moment." }, { status: 502 })
  }
}
