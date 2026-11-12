import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { createCoachingMessage, getCoachingClientRecord, hasCoachingAccess } from "@/lib/authTokens"
import { COACH_THREAD_KEY, coachThreadId } from "@/lib/coachIdentity"
import { notifyAdmin } from "@/lib/notifyAdmin"

export const dynamic = "force-dynamic"

const MAX_MESSAGE = 2000

async function getCallerEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const cognito = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: { accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "" },
    })
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    return result.UserAttributes?.find((a) => a.Name === "email")?.Value ?? null
  } catch {
    return null
  }
}

// POST /api/coaching/talk-first
// "Talk to Lisa first" from the cancellation screen. The message goes into the
// client's normal coaching conversation and Lisa is notified. It never
// schedules, delays or blocks a cancellation; the client can still cancel at
// any time without waiting for a reply.
export async function POST(req: NextRequest) {
  const email = await getCallerEmail(req)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(await hasCoachingAccess(email))) return NextResponse.json({ error: "Coaching access required" }, { status: 403 })

  const payload = (await req.json().catch(() => ({}))) as { message?: unknown; topic?: unknown }
  const message = typeof payload.message === "string" ? payload.message.trim().slice(0, MAX_MESSAGE) : ""
  if (!message) return NextResponse.json({ error: "Write a short message first." }, { status: 400 })
  const topic = typeof payload.topic === "string" ? payload.topic.trim().slice(0, 100) : ""

  const client = await getCoachingClientRecord(email)
  const name = client?.displayName ?? email
  const sentAt = new Date().toISOString()
  await createCoachingMessage({
    threadId: coachThreadId(email),
    fromEmail: email.toLowerCase(),
    toEmail: COACH_THREAD_KEY,
    body: topic ? `Thinking about ending my coaching (${topic}).\n\n${message}` : `Thinking about ending my coaching.\n\n${message}`,
    sentAt,
  })

  notifyAdmin({
    kind: "message-received",
    subject: `${name} would like to talk before cancelling`,
    headline: `${name} is thinking about ending their coaching and asked to talk first`,
    body: [topic ? `About: ${topic}` : "", message, "", "Nothing has been cancelled. They can still cancel online at any time, so a reply soon gives you the best chance to help."].filter(Boolean).join("\n"),
    ctaLabel: "Open client profile",
    ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}`,
    meta: { email },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
