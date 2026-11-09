import { phaseLengthFor, storedWeekCount } from "@/lib/programExpansion"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { listProgramRecords, createProgramRecord } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const programs = await listProgramRecords()
  return NextResponse.json({ programs })
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const data = await req.json()
  if (!data.name || !data.weeks) {
    return NextResponse.json({ error: "name and weeks required" }, { status: 400 })
  }
  const durationWeeks = phaseLengthFor(storedWeekCount(data.weeks), typeof data.durationWeeks === "number" ? data.durationWeeks : undefined)
  const program = await createProgramRecord({ ...data, ...(durationWeeks ? { durationWeeks } : {}) })
  return NextResponse.json({ program })
}
