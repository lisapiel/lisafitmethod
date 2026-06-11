import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { createCoachingMessage, listCoachingMessages, markCoachingMessagesRead } from "@/lib/authTokens"

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

  return NextResponse.json({ message })
}
