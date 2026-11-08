import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { loadCoachingOverview } from "@/lib/coachingOverviewStore"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const overview = await loadCoachingOverview()
    return NextResponse.json(overview, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("coaching overview failed", err)
    return NextResponse.json({ error: "Could not load coaching data" }, { status: 500 })
  }
}
