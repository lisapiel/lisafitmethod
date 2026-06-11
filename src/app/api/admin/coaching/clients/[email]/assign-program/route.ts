import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import {
  getCoachingClientRecord,
  updateCoachingClientRecord,
  getProgramRecord,
  createProgramRecord,
} from "@/lib/authTokens"

export const dynamic = "force-dynamic"

// POST /api/admin/coaching/clients/[email]/assign-program
// body: { programId: string }
// Creates a per-client copy of the program (so per-client edits don't affect
// the template), sets the client's currentProgramId to the copy, returns the
// new program id.
export async function POST(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { email: rawEmail } = await params
  const email = decodeURIComponent(rawEmail).toLowerCase()
  const { programId } = await req.json()
  if (!programId) return NextResponse.json({ error: "programId required" }, { status: 400 })

  const client = await getCoachingClientRecord(email)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const source = await getProgramRecord(programId)
  if (!source) return NextResponse.json({ error: "Program not found" }, { status: 404 })

  // If the source is already a client-specific program for this client, just reactivate.
  if (source.clientEmail?.toLowerCase() === email) {
    await updateCoachingClientRecord(email, { currentProgramId: programId })
    return NextResponse.json({ ok: true, programId, copied: false })
  }

  // Otherwise, copy the template (or another client's program) into a fresh
  // client-owned program record.
  const copy = await createProgramRecord({
    name: `${source.name} — ${client.displayName}`,
    clientEmail: email,
    isTemplate: false,
    status: "ACTIVE",
    weeks: source.weeks,
    notes: source.notes,
  })

  await updateCoachingClientRecord(email, { currentProgramId: copy.id })

  return NextResponse.json({ ok: true, programId: copy.id, copied: true, sourceId: programId })
}
