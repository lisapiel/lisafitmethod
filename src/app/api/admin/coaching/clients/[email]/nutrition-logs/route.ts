import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { listNutritionLogsForClient } from "@/lib/authTokens"
import { isLocalDateKey } from "@/lib/localDate"

export const dynamic = "force-dynamic"

// GET /api/admin/coaching/clients/[email]/nutrition-logs?from=YYYY-MM-DD&to=YYYY-MM-DD
// Admin read-only view of a client's nutrition logs. Date-range filter is optional.
export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { email: rawEmail } = await params
  const email = decodeURIComponent(rawEmail).toLowerCase()
  const url = new URL(req.url)
  const from = url.searchParams.get("from") ?? undefined
  const to = url.searchParams.get("to") ?? undefined
  if (from && !isLocalDateKey(from)) return NextResponse.json({ error: "Invalid from" }, { status: 400 })
  if (to && !isLocalDateKey(to)) return NextResponse.json({ error: "Invalid to" }, { status: 400 })
  const logs = await listNutritionLogsForClient(email, { fromDate: from, toDate: to })
  return NextResponse.json({ logs })
}
