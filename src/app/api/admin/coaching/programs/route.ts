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
  const program = await createProgramRecord(data)
  return NextResponse.json({ program })
}
