import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getCoachingClientRecord, listCoachingApplications } from "@/lib/authTokens"
import { buildIntakeSummary, pickApplicationFor } from "@/lib/intake"

export const dynamic = "force-dynamic"

// GET: { intake } from the client's linked application, or null when there
// isn't one (for example a client Lisa added by hand). Coach only.
export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { email } = await params
  const lower = decodeURIComponent(email).toLowerCase()
  const [apps, client] = await Promise.all([listCoachingApplications(), getCoachingClientRecord(lower)])
  const app = pickApplicationFor(apps, lower)
  return NextResponse.json({ intake: app ? buildIntakeSummary(app, client) : null })
}
