import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { ADMIN_EMAIL, listAllCoachingMessages, listCoachingClientRecords } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
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
    return callerEmail === ADMIN_EMAIL
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [allMessages, clients] = await Promise.all([
    listAllCoachingMessages(),
    listCoachingClientRecords(),
  ])

  const nameMap: Record<string, string> = {}
  for (const c of clients) nameMap[c.email.toLowerCase()] = c.displayName

  // Group by threadId
  const threadMap: Record<string, { messages: typeof allMessages; clientEmail: string }> = {}
  for (const msg of allMessages) {
    const clientEmail = msg.fromEmail === ADMIN_EMAIL ? msg.toEmail : msg.fromEmail
    if (!threadMap[msg.threadId]) {
      threadMap[msg.threadId] = { messages: [], clientEmail }
    }
    threadMap[msg.threadId].messages.push(msg)
  }

  const threads = Object.entries(threadMap).map(([threadId, { messages, clientEmail }]) => {
    const sorted = [...messages].sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    const last = sorted[0]
    const unreadCount = messages.filter((m) => m.fromEmail !== ADMIN_EMAIL && !m.readAt).length
    return {
      threadId,
      clientEmail,
      clientName: nameMap[clientEmail.toLowerCase()] ?? clientEmail,
      lastMessage: last.body.slice(0, 80) + (last.body.length > 80 ? "…" : ""),
      lastAt: last.sentAt,
      unreadCount,
    }
  })

  threads.sort((a, b) => b.lastAt.localeCompare(a.lastAt))
  return NextResponse.json({ threads })
}
