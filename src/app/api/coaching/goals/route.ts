import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { listGoalRecords, createGoalRecord } from "@/lib/authTokens"

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

  const goals = await listGoalRecords(email)
  return NextResponse.json({ goals })
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await req.json()
  if (!data.type) return NextResponse.json({ error: "type required" }, { status: 400 })

  const goal = await createGoalRecord({
    clientEmail: email.toLowerCase(),
    type: data.type,
    label: data.label,
    startDate: data.startDate,
    targetDate: data.targetDate,
    startValue: data.startValue,
    targetValue: data.targetValue,
    currentValue: data.currentValue,
    unit: data.unit,
    notes: data.notes,
    status: data.status ?? "ON_TRACK",
  })
  return NextResponse.json({ goal })
}
