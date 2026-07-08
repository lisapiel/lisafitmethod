import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getWorkoutLogRecord, updateWorkoutLogRecord } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json() as { coachFeedback?: string }
  if (typeof body.coachFeedback !== "string") {
    return NextResponse.json({ error: "coachFeedback required" }, { status: 400 })
  }
  const existing = await getWorkoutLogRecord(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date().toISOString()
  await updateWorkoutLogRecord(id, { coachFeedback: body.coachFeedback, coachFeedbackAt: now })
  return NextResponse.json({ ok: true, coachFeedbackAt: now })
}
