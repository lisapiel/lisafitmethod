import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { ADMIN_EMAIL, listCoachingMessages, createCoachingMessage, markCoachingMessagesRead } from "@/lib/authTokens"

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const coachEmail = await verifyAdmin(req)
  if (!coachEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { threadId } = await params
  const messages = await listCoachingMessages(threadId)
  await markCoachingMessagesRead(threadId, coachEmail)

  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const coachEmail = await verifyAdmin(req)
  if (!coachEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { threadId } = await params
  const { body, toEmail } = await req.json()
  if (!body?.trim() || !toEmail) return NextResponse.json({ error: "body and toEmail required" }, { status: 400 })

  const message = await createCoachingMessage({
    threadId,
    fromEmail: coachEmail.toLowerCase(),
    toEmail: toEmail.toLowerCase(),
    body: body.trim(),
    sentAt: new Date().toISOString(),
  })

  return NextResponse.json({ message })
}
