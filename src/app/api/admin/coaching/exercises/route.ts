import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { listExerciseRecords, createExerciseRecord } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const exercises = await listExerciseRecords()
  return NextResponse.json({ exercises })
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const data = await req.json()
  if (!data.name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const exercise = await createExerciseRecord(data)
  return NextResponse.json({ exercise })
}
