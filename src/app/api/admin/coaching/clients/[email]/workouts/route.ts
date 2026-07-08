import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { listWorkoutLogRecords } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { email: rawEmail } = await params
  const email = decodeURIComponent(rawEmail).toLowerCase()
  const logs = await listWorkoutLogRecords(email)
  return NextResponse.json({ logs: logs.slice(0, 60) })
}
