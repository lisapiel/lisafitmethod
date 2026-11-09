import { phaseLengthFor, storedWeekCount } from "@/lib/programExpansion"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import {
  getCoachingClientRecord,
  updateCoachingClientRecord,
  getProgramRecord,
  createProgramRecord,
} from "@/lib/authTokens"
import { clientWarmupSettings, loadLibraryIndex } from "@/lib/warmups/store"
import { prepareForClient } from "@/lib/warmups/review"

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
  // The copy is new to this client: fill empty warm-ups/cool-downs and
  // re-choose automatic ones for their options. Hand-built ones are kept.
  let weeks = source.weeks
  let warmups = { filled: 0, updated: 0 }
  try {
    const [index, settings] = await Promise.all([loadLibraryIndex(), clientWarmupSettings(email)])
    const prepared = prepareForClient(source.weeks, index, settings.options)
    weeks = prepared.weeks
    warmups = { filled: prepared.filled, updated: prepared.updated }
  } catch (err) {
    console.error("assign-program: warm-up preparation skipped", err)
  }

  const copy = await createProgramRecord({
    name: `${source.name} — ${client.displayName}`,
    clientEmail: email,
    isTemplate: false,
    status: "ACTIVE",
    weeks,
    notes: source.notes,
    // Keep the template's length; a template with fewer written weeks than a
    // standard phase repeats for the default phase length instead of ending early.
    ...(() => { const d = phaseLengthFor(storedWeekCount(weeks), source.durationWeeks); return d ? { durationWeeks: d } : {} })(),
    ...(source.introNote ? { introNote: source.introNote } : {}),
  })

  await updateCoachingClientRecord(email, { currentProgramId: copy.id })

  return NextResponse.json({ ok: true, programId: copy.id, copied: true, sourceId: programId, warmups })
}
