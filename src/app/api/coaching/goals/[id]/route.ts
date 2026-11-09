import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { listGoalRecords, updateGoalRecord, type CoachingGoalRecord } from "@/lib/authTokens"

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  // Clients may only update their own goal, and only its progress fields.
  const own = (await listGoalRecords(email)).find((g) => g.id === id)
  if (!own) return NextResponse.json({ error: "Goal not found" }, { status: 404 })
  const body = (await req.json()) as Record<string, unknown>
  const updates: Partial<CoachingGoalRecord> = {}
  if (typeof body.currentValue === "number" && Number.isFinite(body.currentValue)) updates.currentValue = body.currentValue
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  await updateGoalRecord(id, updates)
  return NextResponse.json({ ok: true })
}
