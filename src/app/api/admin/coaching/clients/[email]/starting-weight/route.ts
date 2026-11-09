import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"
import { deleteStartingWeightChange, listStartingWeightChanges, putStartingWeightChange } from "@/lib/coachingRecords"
import { automaticEstimate, isOnAutomaticEstimate, validateStartingWeightChange } from "@/lib/startingWeight"

export const dynamic = "force-dynamic"

// Lisa corrects a client's starting weight. This only changes the starting
// weight on the client record (and the display unit, if one is sent). It never
// touches weigh-ins, check-ins, measurements or a target Lisa has set.

async function emailOf(params: Promise<{ email: string }>): Promise<string> {
  const { email } = await params
  return decodeURIComponent(email).toLowerCase()
}

// GET: the current starting weight and its correction history, newest first.
export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = await emailOf(params)
  const client = await getCoachingClientRecord(email)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
  return NextResponse.json({ startingWeight: client.startingWeight ?? null, changes: await listStartingWeightChanges(email) })
}

// POST: { value, unit?: "LBS" | "KG", reason, weightUnit?: "LBS" | "KG" }.
// The history record is written first and removed again if the client update
// fails, so the two never disagree.
export async function POST(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = await emailOf(params)

  const client = await getCoachingClientRecord(email)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  let body: { value?: unknown; unit?: unknown; reason?: unknown; weightUnit?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  const input = validateStartingWeightChange({ value: body.value, unit: body.unit, reason: body.reason })
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 })

  const previous = typeof client.startingWeight === "number" ? client.startingWeight : null
  if (previous === input.lbs) {
    return NextResponse.json({ error: `The starting weight is already ${input.lbs} lb. Nothing was changed.` }, { status: 400 })
  }
  const weightUnit = body.weightUnit === "LBS" || body.weightUnit === "KG" ? body.weightUnit : undefined

  const onAutomatic = isOnAutomaticEstimate(client)
  const change = await putStartingWeightChange({
    clientEmail: email,
    previous,
    next: input.lbs,
    unit: input.unit,
    entered: input.entered,
    reason: input.reason,
    changedBy: admin.toLowerCase(),
    changedAt: new Date().toISOString(),
    automaticEstimate: onAutomatic
      ? { previous: automaticEstimate(client), next: automaticEstimate({ ...client, startingWeight: input.lbs }) }
      : undefined,
  })
  try {
    await updateCoachingClientRecord(email, weightUnit ? { startingWeight: input.lbs, weightUnit } : { startingWeight: input.lbs })
  } catch (err) {
    await deleteStartingWeightChange(change.id).catch(() => {})
    const message = err instanceof Error ? err.message : "Unknown DynamoDB error"
    return NextResponse.json({ error: `The starting weight wasn't saved: ${message}` }, { status: 500 })
  }
  return NextResponse.json({ ok: true, startingWeight: input.lbs, change, changes: await listStartingWeightChanges(email) })
}

export const PATCH = POST
