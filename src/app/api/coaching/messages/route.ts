import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { createCoachingMessage, listCoachingMessages, markCoachingMessagesRead, getCoachingClientRecord, hasCoachingAccess, type CoachingMessageKind } from "@/lib/authTokens"
import { notifyAdmin } from "@/lib/notifyAdmin"

const NUTRITION_KIND_LABEL: Record<CoachingMessageKind, string> = {
  "nutrition-meal": "Nutrition · Meal",
  "nutrition-day": "Nutrition · Day of eating",
  "nutrition-question": "Nutrition · Question",
}
const NUTRITION_KINDS = Object.keys(NUTRITION_KIND_LABEL) as CoachingMessageKind[]

export const dynamic = "force-dynamic"

const COACH_EMAIL = "lisa.p.mcpherson@gmail.com"

async function getSessionEmail(): Promise<string | null> {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec): Promise<string | null> => {
      try {
        const session = await fetchAuthSession(contextSpec)
        return (session.tokens?.idToken?.payload?.email as string | undefined) ?? null
      } catch {
        return null
      }
    },
  })
}

export async function GET() {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const threadId = [email.toLowerCase(), COACH_EMAIL].sort().join("_")
  const messages = await listCoachingMessages(threadId)
  await markCoachingMessagesRead(threadId, email)

  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only active coaching clients can post new messages on this route. Existing
  // /my-coaching layout already redirects non-clients away, but the API needs
  // its own gate so a lapsed client can't keep posting via curl.
  const active = await hasCoachingAccess(email)
  if (!active) return NextResponse.json({ error: "Coaching access required" }, { status: 403 })

  const payload = await req.json() as {
    body?: string
    kind?: string
    attachmentS3Keys?: string[]
  }
  const bodyText = (payload.body ?? "").trim()

  // Validate kind — must be a known nutrition kind, or absent (plain text).
  let kind: CoachingMessageKind | undefined
  if (payload.kind != null && payload.kind !== "") {
    if (!NUTRITION_KINDS.includes(payload.kind as CoachingMessageKind)) {
      return NextResponse.json({ error: "Invalid message kind" }, { status: 400 })
    }
    kind = payload.kind as CoachingMessageKind
  }

  // Validate + normalize attachments. Each key must live under the shared
  // nutrition-messages prefix — refuse anything else so a client can't
  // reference arbitrary paths.
  let attachmentS3Keys: string | undefined
  const rawKeys = Array.isArray(payload.attachmentS3Keys)
    ? payload.attachmentS3Keys.filter((k): k is string => typeof k === "string" && k.length > 0)
    : []
  if (rawKeys.length > 0) {
    const invalid = rawKeys.find((k) => !k.startsWith("media/nutrition-messages/") || k.length > 512)
    if (invalid) return NextResponse.json({ error: "Invalid attachment key" }, { status: 400 })
    if (rawKeys.length > 6) return NextResponse.json({ error: "Too many attachments (max 6)" }, { status: 400 })
    attachmentS3Keys = rawKeys.join(",")
  }

  // Require at least body text or an attachment.
  if (!bodyText && !attachmentS3Keys) {
    return NextResponse.json({ error: "Message body or attachment required" }, { status: 400 })
  }

  const threadId = [email.toLowerCase(), COACH_EMAIL].sort().join("_")
  const message = await createCoachingMessage({
    threadId,
    fromEmail: email.toLowerCase(),
    toEmail: COACH_EMAIL,
    body: bodyText,
    sentAt: new Date().toISOString(),
    ...(kind ? { kind } : {}),
    ...(attachmentS3Keys ? { attachmentS3Keys } : {}),
  })

  // Notify Lisa (non-blocking). Nutrition submissions get a distinct kind so
  // she can spot them in her inbox; plain text keeps the existing kind so the
  // notification email hasn't changed for regular chatter.
  const client = await getCoachingClientRecord(email).catch(() => null)
  const clientName = client?.displayName || email
  const label = kind ? NUTRITION_KIND_LABEL[kind] : null
  const attachmentCount = rawKeys.length
  const notifBody = kind
    ? `${label}\n${attachmentCount > 0 ? `${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}\n` : ""}${bodyText || "(no text)"}`.slice(0, 800)
    : bodyText.slice(0, 500)
  notifyAdmin({
    kind: kind ? "nutrition-message" : "message-received",
    subject: kind ? `Nutrition message from ${clientName}` : `Message from ${clientName}`,
    headline: kind ? `${clientName} sent nutrition to review` : `${clientName} sent you a message`,
    body: notifBody,
    ctaLabel: "Open conversation",
    ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}/messages`,
    meta: {
      from: email,
      ...(label ? { type: label } : {}),
      ...(attachmentCount > 0 ? { attachments: attachmentCount } : {}),
    },
  }).catch(() => {})

  return NextResponse.json({ message })
}
