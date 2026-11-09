import { NextResponse } from "next/server"
import { clientSessionEmail as sessionEmail } from "@/lib/clientSession"
import { listAssessmentsForClient, toClientAssessment } from "@/lib/coachingRecords"

export const dynamic = "force-dynamic"

// GET: the client's shared assessments only (never drafts or private notes).
export async function GET() {
  const email = await sessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const list = (await listAssessmentsForClient(email)).map(toClientAssessment).filter(Boolean)
  return NextResponse.json({ assessments: list })
}
