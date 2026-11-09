import { NextResponse } from "next/server"
import { clientSessionEmail as getSessionEmail } from "@/lib/clientSession"
import { getNutritionLog } from "@/lib/authTokens"
import { getRecovery, updateRecovery } from "@/lib/coachingRecords"

export const dynamic = "force-dynamic"

// A client flags a recovered estimate as wrong. Only the flag is stored, for
// Lisa to review; the entry, the values and the original message stay as they are.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const log = await getNutritionLog(id)
  if (!log || log.clientEmail !== email || log.source !== "message-estimate" || !log.sourceMessageId) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const rec = await getRecovery(log.sourceMessageId)
  if (!rec || rec.clientEmail !== email) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const body = await req.json().catch(() => ({})) as { note?: string }
  await updateRecovery(rec.messageId, { clientFlag: { note: (body.note ?? "").trim().slice(0, 500), at: new Date().toISOString() } })
  return NextResponse.json({ ok: true })
}
