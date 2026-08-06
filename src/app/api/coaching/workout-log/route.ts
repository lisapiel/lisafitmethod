import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { listWorkoutLogRecords, createWorkoutLogRecord, getCoachingClientRecord } from "@/lib/authTokens"
import { notifyAdmin } from "@/lib/notifyAdmin"

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

  // Fire admin notification (non-blocking — email failures never break the save)
  ;(async () => {
    try {
      const client = await getCoachingClientRecord(email).catch(() => null)
      const clientName = client?.displayName || email
      const setDataStr = typeof data.setData === "string" ? data.setData : JSON.stringify(data.setData ?? [])
      let totalSets = 0
      let completedSets = 0
      let exerciseCount = 0
      try {
        const sets = JSON.parse(setDataStr) as Array<{ completed?: boolean; exerciseId?: string }>
        totalSets = sets.length
        completedSets = sets.filter((s) => s.completed).length
        exerciseCount = new Set(sets.map((s) => s.exerciseId).filter(Boolean)).size
      } catch { /* ignore */ }

      const summary = [
        `${completedSets}/${totalSets} sets logged across ${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}.`,
        data.clientNotes ? `\nClient note: ${String(data.clientNotes).slice(0, 300)}` : "",
      ].filter(Boolean).join(" ")

      await notifyAdmin({
        kind: "workout-completed",
        subject: `${clientName} finished a workout`,
        headline: `${clientName} completed ${data.dayLabel ?? "a workout"}`,
        body: summary || "(No notes shared.)",
        ctaLabel: "See their progress",
        ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}/workouts`,
        meta: {
          client: email,
          "week / day": `Week ${data.weekNumber ?? "?"} · ${data.dayLabel ?? "?"}`,
          "overall RPE": data.overallRpe ? `${data.overallRpe}/10` : null,
          "energy level": data.energyLevel ? `${data.energyLevel}/5` : null,
          "sets completed": `${completedSets} / ${totalSets}`,
        },
      })
    } catch (err) {
      console.error("workout-completed notifyAdmin failed", err)
    }
  })()

  return NextResponse.json({ log })
}
