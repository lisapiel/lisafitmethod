import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import {
  ADMIN_EMAIL,
  getCoachingCheckIn,
  updateCoachingCheckIn,
  createCoachingMessage,
} from "@/lib/authTokens"

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
    return callerEmail === ADMIN_EMAIL ? callerEmail : null
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

  // Send feedback as a message to the client thread
  const threadId = [coachEmail.toLowerCase(), checkIn.clientEmail.toLowerCase()].sort().join("_")
  const submittedDate = new Date(checkIn.submittedAt).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  })
  await createCoachingMessage({
    threadId,
    fromEmail: coachEmail.toLowerCase(),
    toEmail: checkIn.clientEmail.toLowerCase(),
    body: `Feedback on your check-in from ${submittedDate}:\n\n${feedback.trim()}`,
    sentAt: now,
  })

  return NextResponse.json({ ok: true })
}
