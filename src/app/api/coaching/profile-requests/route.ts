import { NextRequest, NextResponse } from "next/server"
import { clientSessionEmail } from "@/lib/clientSession"
import { getCoachingClientRecord } from "@/lib/authTokens"
import { acquireProfileRequestLock, listProfileChangeRequests, newRecordId, putProfileChangeRequest, releaseProfileRequestLock } from "@/lib/coachingRecords"
import { PENDING_REQUEST_ERROR, buildProfileRequest, ownRequests, toClientProfileRequest, validateProfileRequest } from "@/lib/profileRequests"

export const dynamic = "force-dynamic"

// A client's own goal and activity change requests. The signed-in email is the
// only key used, so nobody can read or create a request for someone else.

async function mine(email: string) {
  return ownRequests(await listProfileChangeRequests(email), email)
}

// GET: { requests } newest first, in the client view (no coach identity or
// estimate numbers; Lisa's note only on a declined request).
export async function GET() {
  const email = await clientSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ requests: (await mine(email)).map(toClientProfileRequest) })
}

// POST: { nutritionGoal?, activityLevel?, reason }. Creates a pending request
// and leaves the client record exactly as it is. Refused while another request
// is still pending. The pending check reads the list, so two submissions at
// once could both pass it; the per-client lock is what lets only one through.
export async function POST(req: NextRequest) {
  const email = await clientSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { nutritionGoal?: unknown; activityLevel?: unknown; reason?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 })
  }

  const [client, existing] = await Promise.all([getCoachingClientRecord(email), mine(email)])
  const input = validateProfileRequest(client, existing, body)
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: input.status })

  const id = newRecordId()
  const now = new Date()
  if (!(await acquireProfileRequestLock(email, id, now))) {
    return NextResponse.json({ error: PENDING_REQUEST_ERROR }, { status: 409 })
  }
  const request = buildProfileRequest({ ...client!, email }, input, id, now)
  try {
    await putProfileChangeRequest(request)
  } catch (err) {
    await releaseProfileRequestLock(email, id).catch(() => {})
    throw err
  }
  return NextResponse.json({ ok: true, request: toClientProfileRequest(request), requests: (await mine(email)).map(toClientProfileRequest) })
}
