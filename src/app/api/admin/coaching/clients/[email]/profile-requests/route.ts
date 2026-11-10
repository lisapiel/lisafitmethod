import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"
import {
  decideProfileChangeRequestRecord, getProfileChangeRequest, listProfileChangeRequests, releaseProfileRequestLock, reopenProfileChangeRequest,
} from "@/lib/coachingRecords"
import { decideProfileRequest } from "@/lib/profileRequests"

export const dynamic = "force-dynamic"

// Lisa reviews a client's goal and activity change requests. Approving changes
// only nutritionGoal and activityLevel on the client record. A target she set
// (customMacros) is never read or written here, and no target is ever applied
// automatically.

async function emailOf(params: Promise<{ email: string }>): Promise<string> {
  const { email } = await params
  return decodeURIComponent(email).toLowerCase()
}

// GET: { requests } newest first.
export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = await emailOf(params)
  return NextResponse.json({ requests: await listProfileChangeRequests(email) })
}

// POST: { id, action: "approve" | "decline", note? }. The request is marked
// decided first (only while still pending), then the client record is updated.
// If that update fails the request goes back to pending so the two agree.
// Once decided, the client's pending-request lock is freed so they can send
// another. A lock left behind by a failure here is stale and gets replaced.
export async function POST(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = await emailOf(params)

  let body: { id?: unknown; action?: unknown; note?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 })

  const [request, client] = await Promise.all([getProfileChangeRequest(id), getCoachingClientRecord(email)])
  const owned = request && request.clientEmail.toLowerCase() === email ? request : null
  const decision = decideProfileRequest(owned, client, { action: body.action, note: body.note }, admin, new Date())
  if (!decision.ok) return NextResponse.json({ error: decision.error }, { status: decision.status })

  const marked = await decideProfileChangeRequestRecord(id, decision.request)
  if (!marked) return NextResponse.json({ error: "This request has already been decided." }, { status: 409 })

  if (Object.keys(decision.clientUpdates).length > 0) {
    try {
      await updateCoachingClientRecord(email, decision.clientUpdates)
    } catch (err) {
      await reopenProfileChangeRequest(id).catch(() => {})
      const message = err instanceof Error ? err.message : "Unknown DynamoDB error"
      return NextResponse.json({ error: `The change wasn't saved: ${message}` }, { status: 500 })
    }
  }

  await releaseProfileRequestLock(email, id).catch(() => {})
  return NextResponse.json({ ok: true, requests: await listProfileChangeRequests(email) })
}

export const PATCH = POST
