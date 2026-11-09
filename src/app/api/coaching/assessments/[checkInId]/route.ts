import { NextResponse } from "next/server"
import { getAssessment, setPriorityChecks, toClientAssessment } from "@/lib/coachingRecords"
import { clientSessionEmail as sessionEmail } from "@/lib/clientSession"

export const dynamic = "force-dynamic"

// PATCH: the client ticks or unticks one priority. The only change a client
// can make to an assessment.
export async function PATCH(req: Request, { params }: { params: Promise<{ checkInId: string }> }) {
  const email = await sessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { checkInId } = await params
  const a = await getAssessment(checkInId)
  if (!a || a.clientEmail !== email || a.status !== "sent") return NextResponse.json({ error: "Not found" }, { status: 404 })
  const body = await req.json().catch(() => ({})) as { index?: number; done?: boolean }
  const i = Number(body.index)
  if (!Number.isInteger(i) || i < 0 || i >= (a.priorities ?? []).length) return NextResponse.json({ error: "Unknown priority" }, { status: 400 })
  const checks = { ...(a.priorityChecks ?? {}) }
  if (body.done) checks[String(i)] = new Date().toISOString()
  else delete checks[String(i)]
  await setPriorityChecks(checkInId, checks)
  return NextResponse.json({ assessment: toClientAssessment({ ...a, priorityChecks: checks }) })
}
