import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { listSnapshotRecords } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { email } = await params
  const decoded = decodeURIComponent(email)
  const snapshots = await listSnapshotRecords(decoded)
  return NextResponse.json({ snapshots })
}
