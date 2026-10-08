import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getProgramRecord, updateProgramRecord, createProgramRecord, clearProgramField } from "@/lib/authTokens"
import { hydrateProgramVideos } from "@/lib/programHydration"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const rawProgram = await getProgramRecord(id)
  if (!rawProgram) return NextResponse.json({ error: "Not found" }, { status: 404 })
  // Resolve exercise videos from the canonical library before responding
  // so the admin program viewer + admin workout-log viewer both surface
  // working thumbnails even when the stored program has empty
  // videoS3Key values. Storage is untouched — the DB record is not
  // rewritten. Duplicate/mutate flows below still use the raw record.
  const program = await hydrateProgramVideos(rawProgram)
  return NextResponse.json({ program })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json() as Record<string, unknown>

  // Handle durationWeeks explicitly:
  //   - number (1..52)        → SET (via generic update)
  //   - null                  → REMOVE the attribute
  //   - key absent/undefined  → do not touch
  // The generic marshaller would throw on `undefined`, so we never pass
  // the key through unless it's a concrete number.
  const { durationWeeks, ...rest } = body
  if (durationWeeks === null) {
    await clearProgramField(id, "durationWeeks")
    if (Object.keys(rest).length > 0) await updateProgramRecord(id, rest as Partial<Parameters<typeof updateProgramRecord>[1]>)
    return NextResponse.json({ ok: true })
  }
  if (typeof durationWeeks === "number") {
    if (!Number.isInteger(durationWeeks) || durationWeeks < 1 || durationWeeks > 52) {
      return NextResponse.json({ error: "durationWeeks must be an integer between 1 and 52." }, { status: 400 })
    }
    await updateProgramRecord(id, { ...rest, durationWeeks } as Partial<Parameters<typeof updateProgramRecord>[1]>)
    return NextResponse.json({ ok: true })
  }
  // No durationWeeks in the body: just update the rest.
  await updateProgramRecord(id, rest as Partial<Parameters<typeof updateProgramRecord>[1]>)
  return NextResponse.json({ ok: true })
}

// POST handles "duplicate" — body { newName, asTemplate } based on existing program
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const { newName, asTemplate } = await req.json()
  const source = await getProgramRecord(id)
  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 })

  const program = await createProgramRecord({
    name: newName || `${source.name} (Copy)`,
    weeks: source.weeks,
    notes: source.notes,
    isTemplate: !!asTemplate,
    status: "DRAFT",
    // Carry rotation length so duplicates behave like the source program.
    ...(typeof source.durationWeeks === "number" ? { durationWeeks: source.durationWeeks } : {}),
  })
  return NextResponse.json({ program })
}
