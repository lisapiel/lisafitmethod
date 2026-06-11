import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { listWorkoutLogRecords, createWorkoutLogRecord } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

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

  const logs = await listWorkoutLogRecords(email)
  return NextResponse.json({ logs })
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await req.json()
  const log = await createWorkoutLogRecord({
    clientEmail: email.toLowerCase(),
    programId: data.programId,
    weekNumber: data.weekNumber,
    dayLabel: data.dayLabel,
    completedAt: new Date().toISOString(),
    setData: typeof data.setData === "string" ? data.setData : JSON.stringify(data.setData ?? []),
    overallRpe: data.overallRpe,
    energyLevel: data.energyLevel,
    clientNotes: data.clientNotes,
  })
  return NextResponse.json({ log })
}
