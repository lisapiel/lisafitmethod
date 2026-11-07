import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getProgramRecord, listCoachingClientRecords, listProgramRecords, updateProgramRecord, type CoachingProgramRecord } from "@/lib/authTokens"
import { clientWarmupSettings, loadLibraryIndex } from "@/lib/warmups/store"
import { DEFAULT_OPTIONS, type WarmupOptions } from "@/lib/warmups/engine"
import { applyReview, reviewProgram, type ReviewSelection } from "@/lib/warmups/review"

export const dynamic = "force-dynamic"

function templateOptions(p: CoachingProgramRecord): WarmupOptions {
  return { ...DEFAULT_OPTIONS, ...(p.warmupOptions ?? {}) }
}

// GET: every program with empty warm-ups or cool-downs and what the rules
// would add. Read-only.
export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const [programs, clients, index] = await Promise.all([listProgramRecords(), listCoachingClientRecords(), loadLibraryIndex()])
  const settingsCache = new Map<string, Awaited<ReturnType<typeof clientWarmupSettings>>>()
  const out = []
  for (const p of programs) {
    const email = p.clientEmail?.toLowerCase()
    const client = email ? clients.find((c) => c.email.toLowerCase() === email) : undefined
    if (email && !settingsCache.has(email)) settingsCache.set(email, await clientWarmupSettings(email))
    const settings = email ? settingsCache.get(email) : undefined
    const options = settings?.options ?? templateOptions(p)
    let items
    try { items = reviewProgram(p.weeks, index, options) } catch { continue }
    if (items.length === 0) continue
    out.push({
      id: p.id, name: p.name, isTemplate: !!p.isTemplate, status: p.status ?? "DRAFT", updatedAt: p.updatedAt ?? "",
      client: client ? { email: client.email, displayName: client.displayName, status: client.status ?? null, isCurrent: client.currentProgramId === p.id } : null,
      options, reasons: settings?.suggestion.reasons ?? {}, profileFlags: settings?.suggestion.flags ?? [], profileSaved: !!settings?.profile,
      items,
    })
  }
  out.sort((a, b) => Number(b.client?.isCurrent ?? false) - Number(a.client?.isCurrent ?? false) || Number(a.isTemplate) - Number(b.isTemplate) || a.name.localeCompare(b.name))
  return NextResponse.json({ programs: out })
}

// POST: apply the selected additions to one program. Refuses if the program
// changed since the review was loaded, and only ever fills empty sequences.
export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { programId?: string; updatedAt?: string; selection?: ReviewSelection[] } | null
  if (!body?.programId || !Array.isArray(body.selection) || body.selection.length === 0) {
    return NextResponse.json({ error: "programId and selection are required" }, { status: 400 })
  }
  const program = await getProgramRecord(body.programId)
  if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 })
  if ((program.updatedAt ?? "") !== (body.updatedAt ?? "")) {
    return NextResponse.json({ error: "This program was edited after the review loaded. Reload and review again." }, { status: 409 })
  }
  const index = await loadLibraryIndex()
  const options = program.clientEmail ? (await clientWarmupSettings(program.clientEmail)).options : templateOptions(program)
  const result = applyReview(program.weeks, index, options, body.selection)
  if (result.applied > 0) await updateProgramRecord(program.id, { weeks: result.weeks })
  return NextResponse.json({ applied: result.applied, skipped: result.skipped })
}
