import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import {
  isAdminEmail,
  getCoachingCheckIn,
  updateCoachingCheckIn,
  createCoachingMessage,
  listCoachingMessages,
  updateCoachingMessageBody,
} from "@/lib/authTokens"
import { adminMfaOk } from "@/lib/adminMfa"
import { checkInFeedbackPrefix, coachThreadId, isCoachSender } from "@/lib/coachIdentity"

export const dynamic = "force-dynamic"

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const cognito = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    })
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    return callerEmail && isAdminEmail(callerEmail) && adminMfaOk(result) ? callerEmail : null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const coachEmail = await verifyAdmin(req)
  if (!coachEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const checkIn = await getCoachingCheckIn(id)
  if (!checkIn) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ checkIn })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const coachEmail = await verifyAdmin(req)
  if (!coachEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { feedback } = await req.json()
  if (!feedback?.trim()) return NextResponse.json({ error: "Feedback required" }, { status: 400 })

  const checkIn = await getCoachingCheckIn(id)
  if (!checkIn) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date().toISOString()
  await updateCoachingCheckIn(id, {
    status: "REVIEWED",
    coachFeedback: feedback.trim(),
    reviewedAt: now,
  })

  // Always the thread the client sees, whichever admin account is signed in.
  // Saving again updates the earlier feedback message instead of posting another.
  const threadId = coachThreadId(checkIn.clientEmail)
  const prefix = checkInFeedbackPrefix(checkIn.submittedAt)
  const body = `${prefix}\n\n${feedback.trim()}`
  const earlier = (await listCoachingMessages(threadId))
    .filter((m) => isCoachSender(m.fromEmail) && m.toEmail.toLowerCase() === checkIn.clientEmail.toLowerCase() && m.body.startsWith(prefix))
    .pop()
  if (earlier) {
    if (earlier.body !== body) await updateCoachingMessageBody(earlier, body)
  } else {
    await createCoachingMessage({
      threadId,
      fromEmail: coachEmail.toLowerCase(),
      toEmail: checkIn.clientEmail.toLowerCase(),
      body,
      sentAt: now,
    })
  }

  return NextResponse.json({ ok: true })
}
