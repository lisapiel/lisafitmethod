import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { createNutritionLog, deleteNutritionLog, getCoachingClientRecord, listCoachingMessages, listNutritionLogsForClient } from "@/lib/authTokens"
import { coachThreadId } from "@/lib/coachThreadKey"
import { isAdminEmail } from "@/lib/authTokens"
import { createRecovery, deleteRecoveryRecord, getRecovery, listRecoveries, updateRecovery } from "@/lib/coachingRecords"
import { resolveMacrosFor } from "@/lib/nutrition"
import { isLocalDateKey } from "@/lib/localDate"

export const dynamic = "force-dynamic"

// Coach-only recovery of food reports a client sent in Messages before Food
// existed. Lisa reads the original and types the values; nothing is parsed or
// estimated. Days that already have food logs are always kept as they are.

async function clientFrom(params: Promise<{ email: string }>) {
  const { email } = await params
  return decodeURIComponent(email).toLowerCase()
}

// GET: the client's messages to the coach (newest first) and existing recoveries.
export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = await clientFrom(params)
  const [messages, recoveries] = await Promise.all([listCoachingMessages(coachThreadId(email)), listRecoveries(email)])
  const fromClient = messages
    .filter((m) => m.fromEmail.toLowerCase() === email && !isAdminEmail(m.fromEmail))
    .map((m) => ({ id: m.id, sentAt: m.sentAt, body: m.body }))
    .reverse()
  return NextResponse.json({ messages: fromClient, recoveries })
}

const opt = (v: unknown, max: number) => {
  if (v == null || v === "") return { ok: true as const, value: undefined }
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= max ? { ok: true as const, value: Math.round(n) } : { ok: false as const }
}

// POST: confirm a recovery for one message.
export async function POST(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = await clientFrom(params)
  const body = await req.json().catch(() => ({})) as { messageId?: string; date?: string; calories?: unknown; protein?: unknown; carbs?: unknown; fat?: unknown }
  if (!body.messageId || !isLocalDateKey(body.date ?? "")) return NextResponse.json({ error: "Pick the message and the day it describes." }, { status: 400 })
  const calories = Number(body.calories)
  if (!Number.isFinite(calories) || calories <= 0 || calories > 8000) return NextResponse.json({ error: "Enter the calories the client reported." }, { status: 400 })
  const protein = opt(body.protein, 400), carbs = opt(body.carbs, 800), fat = opt(body.fat, 300)
  if (!protein.ok || !carbs.ok || !fat.ok) return NextResponse.json({ error: "Check the macro values." }, { status: 400 })

  const message = (await listCoachingMessages(coachThreadId(email))).find((m) => m.id === body.messageId)
  if (!message || message.fromEmail.toLowerCase() !== email) return NextResponse.json({ error: "That message isn't from this client." }, { status: 404 })

  const sameDay = await listNutritionLogsForClient(email, { fromDate: body.date, toDate: body.date })
  if (sameDay.length > 0) {
    return NextResponse.json({ error: "day-has-logs", detail: "This day already has food logs, so they're kept as they are and the old report isn't added.", count: sameDay.length }, { status: 409 })
  }

  const confirmedAt = new Date().toISOString()
  const created = await createRecovery({
    messageId: body.messageId, clientEmail: email, date: body.date!, calories: Math.round(calories),
    protein: protein.value, carbs: carbs.value, fat: fat.value, status: "active", confirmedBy: admin.toLowerCase(), confirmedAt,
  })
  if (!created) return NextResponse.json({ error: "This message has already been recovered." }, { status: 409 })

  try {
    const client = await getCoachingClientRecord(email)
    const t = client ? resolveMacrosFor(client) : null
    const log = await createNutritionLog({
      clientEmail: email, date: body.date!, kind: "quick", calories: Math.round(calories),
      protein: protein.value, carbs: carbs.value, fat: fat.value,
      source: "message-estimate", sourceMessageId: body.messageId,
      targetAtLog: t ? { calories: t.calories, protein: t.protein, carbs: t.carbs, fat: t.fat } : undefined,
    })
    await updateRecovery(body.messageId, { logId: log.id })
    return NextResponse.json({ ok: true, recovery: await getRecovery(body.messageId), log })
  } catch (err) {
    await deleteRecoveryRecord(body.messageId).catch(() => {})
    return NextResponse.json({ error: `Recovery failed: ${err instanceof Error ? err.message : "unknown error"}` }, { status: 500 })
  }
}

// DELETE: undo a recovery. The food entry is removed so totals match exactly
// what they were; the recovery record keeps the trail.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = await clientFrom(params)
  const body = await req.json().catch(() => ({})) as { messageId?: string; reason?: string }
  const rec = body.messageId ? await getRecovery(body.messageId) : null
  if (!rec || rec.clientEmail !== email || rec.status !== "active") return NextResponse.json({ error: "Nothing to undo." }, { status: 404 })
  if (rec.logId) await deleteNutritionLog(rec.logId)
  await updateRecovery(rec.messageId, { status: "undone", undoneBy: admin.toLowerCase(), undoneAt: new Date().toISOString(), undoReason: (body.reason ?? "").trim().slice(0, 500) || undefined })
  return NextResponse.json({ ok: true })
}
