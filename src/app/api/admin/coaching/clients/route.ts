import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { listCoachingClientRecords } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const adminEmail = await verifyAdminRequest(req)
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const records = await listCoachingClientRecords()
  return NextResponse.json({
    clients: records.map((r) => ({
      email: r.email,
      name: r.displayName ?? null,
      startedAt: r.createdAt ?? r.startDate ?? null,
    })),
  })
}
