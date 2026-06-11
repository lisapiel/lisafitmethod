import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getProgramRecord, updateProgramRecord, createProgramRecord } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const program = await getProgramRecord(id)
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ program })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const updates = await req.json()
  await updateProgramRecord(id, updates)
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
  })
  return NextResponse.json({ program })
}
