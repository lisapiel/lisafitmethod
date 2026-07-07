import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { createCoachingMessage, listCoachingMessages, markCoachingMessagesRead, getCoachingClientRecord } from "@/lib/authTokens"
import { notifyAdmin } from "@/lib/notifyAdmin"

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

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 })

  const threadId = [email.toLowerCase(), COACH_EMAIL].sort().join("_")
  const message = await createCoachingMessage({
    threadId,
    fromEmail: email.toLowerCase(),
    toEmail: COACH_EMAIL,
    body: body.trim(),
    sentAt: new Date().toISOString(),
  })

  // Notify Lisa (non-blocking)
  const client = await getCoachingClientRecord(email).catch(() => null)
  const clientName = client?.displayName || email
  notifyAdmin({
    kind: "message-received",
    subject: `Message from ${clientName}`,
    headline: `${clientName} sent you a message`,
    body: body.trim().slice(0, 500),
    ctaLabel: "Reply",
    ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}/messages`,
    meta: { from: email },
  }).catch(() => {})

  return NextResponse.json({ message })
}
