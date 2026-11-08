import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { listWorkoutLogRecords, createWorkoutLogRecord, createWorkoutLogRecordOnce, getCoachingClientRecord } from "@/lib/authTokens"
import { isValidSubmissionId } from "@/lib/workoutLogSave"
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

  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
  // Sport-day fields are only accepted when the client explicitly marked
  // this submission as a sport log. The shape stays backward-compatible —
  // strength workouts never carry these fields, and every historical
  // reader ignores them.
  const isSport = data.dayType === "sport"
  const intensityRaw = typeof data.sportIntensity === "string" ? data.sportIntensity.toLowerCase() : ""
  const sportIntensity: "easy" | "moderate" | "hard" | undefined =
    intensityRaw === "easy" || intensityRaw === "moderate" || intensityRaw === "hard" ? intensityRaw : undefined
  const sportDurationRaw = Number(data.sportDurationMinutes)
  const sportDurationMinutes =
    Number.isFinite(sportDurationRaw) && sportDurationRaw > 0 && sportDurationRaw <= 1440
      ? Math.round(sportDurationRaw)
      : undefined
  const sportName =
    typeof data.sportName === "string" && data.sportName.trim().length > 0
      ? data.sportName.trim().slice(0, 80)
      : undefined

  const fields = {
    clientEmail: email.toLowerCase(),
    programId: data.programId as string,
    weekNumber: data.weekNumber as number,
    dayLabel: data.dayLabel as string,
    completedAt: new Date().toISOString(),
    setData: typeof data.setData === "string" ? data.setData : JSON.stringify(data.setData ?? []),
    overallRpe: isSport ? undefined : (data.overallRpe as number | undefined),
    energyLevel: data.energyLevel as number | undefined,
    clientNotes: data.clientNotes as string | undefined,
    ...(isSport ? { dayType: "sport" as const, sportName, sportDurationMinutes, sportIntensity } : {}),
  }

  // Pages loaded before this release send no submissionId; they keep the old
  // behaviour until the client refreshes.
  let log
  if (isValidSubmissionId(data.submissionId)) {
    const saved = await createWorkoutLogRecordOnce(fields, data.submissionId)
    if (!saved.created) return NextResponse.json({ log: saved.record, duplicate: true })
    log = saved.record
  } else {
    log = await createWorkoutLogRecord(fields)
  }

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

      // Sport days have no sets; swap the summary + meta accordingly so
      // the admin email reads naturally.
      const summary = isSport
        ? [
            `Sport: ${sportName ?? "(unspecified)"} · ${sportDurationMinutes ?? "?"} min · ${sportIntensity ? sportIntensity[0].toUpperCase() + sportIntensity.slice(1) : "Unspecified"} intensity.`,
            data.clientNotes ? `\nClient note: ${String(data.clientNotes).slice(0, 300)}` : "",
          ].filter(Boolean).join(" ")
        : [
            `${completedSets}/${totalSets} sets logged across ${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}.`,
            data.clientNotes ? `\nClient note: ${String(data.clientNotes).slice(0, 300)}` : "",
          ].filter(Boolean).join(" ")

      await notifyAdmin({
        kind: "workout-completed",
        subject: isSport ? `${clientName} logged a sport session` : `${clientName} finished a workout`,
        headline: `${clientName} completed ${data.dayLabel ?? "a workout"}`,
        body: summary || "(No notes shared.)",
        ctaLabel: "See their progress",
        ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}/workouts`,
        meta: isSport
          ? {
              client: email,
              "week / day": `Week ${data.weekNumber ?? "?"} · ${data.dayLabel ?? "?"}`,
              "sport": sportName ?? null,
              "duration": sportDurationMinutes != null ? `${sportDurationMinutes} min` : null,
              "intensity": sportIntensity ?? null,
            }
          : {
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
