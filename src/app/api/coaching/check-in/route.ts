import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { createCoachingCheckIn, listCoachingCheckIns, getCoachingClientRecord } from "@/lib/authTokens"
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

  const checkIns = await listCoachingCheckIns(email)
  return NextResponse.json({ checkIns })
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // Sanitize measurements: array of { label, value, unit } — drop empty rows
  type MeasurementIn = { label?: unknown; value?: unknown; unit?: unknown }
  const rawMeasurements = Array.isArray(body.measurements) ? body.measurements as MeasurementIn[] : []
  const measurements = rawMeasurements
    .map((m) => ({
      label: String(m.label ?? "").trim(),
      value: String(m.value ?? "").trim(),
      unit: String(m.unit ?? "").trim(),
    }))
    .filter((m) => m.label && m.value)

  // Weight sanitation: parse to number, refuse NaN / non-positive / silly-large
  // values. A stored NaN would poison every Progress chart downstream; a
  // stored zero would render as "0 lb since start". Silent drop if invalid —
  // the rest of the check-in still saves. The client-side form has its own
  // typo confirmation for values that parse but look wildly off.
  let parsedWeight: number | undefined
  if (body.weight != null && body.weight !== "") {
    const n = parseFloat(String(body.weight))
    if (Number.isFinite(n) && n > 0 && n < 2000) parsedWeight = n
  }

  const checkIn = await createCoachingCheckIn({
    clientEmail: email.toLowerCase(),
    submittedAt: new Date().toISOString(),
    status: "PENDING",
    ...(parsedWeight != null && { weight: parsedWeight }),
    ...(body.weightUnit && { weightUnit: body.weightUnit }),
    ...(body.sleepQuality && { sleepQuality: body.sleepQuality }),
    ...(body.energyLevel && { energyLevel: body.energyLevel }),
    ...(body.hungerLevel && { hungerLevel: body.hungerLevel }),
    ...(body.stressLevel && { stressLevel: body.stressLevel }),
    ...(body.digestion && { digestion: body.digestion }),
    ...(body.trainingPerformance && { trainingPerformance: body.trainingPerformance }),
    ...(body.nutritionAdherence && { nutritionAdherence: body.nutritionAdherence }),
    ...(body.workoutConsistency && { workoutConsistency: body.workoutConsistency }),
    ...(body.wins && { wins: body.wins }),
    ...(body.struggles && { struggles: body.struggles }),
    ...(body.questionsForCoach && { questionsForCoach: body.questionsForCoach }),
    ...(body.additionalNotes && { additionalNotes: body.additionalNotes }),
    ...(measurements.length > 0 && { measurementSnapshot: JSON.stringify(measurements) }),
  })

  // Fire admin notification (non-blocking)
  const client = await getCoachingClientRecord(email).catch(() => null)
  const clientName = client?.displayName || email
  const excerpt = [body.wins, body.struggles, body.questionsForCoach].filter(Boolean).map((s: string) => String(s).slice(0, 220)).join("\n\n") || "(No text notes — see check-in for ratings + weight.)"
  notifyAdmin({
    kind: "check-in-received",
    subject: `Check-in from ${clientName}`,
    headline: `${clientName} submitted their weekly check-in`,
    body: excerpt,
    ctaLabel: "Review check-in",
    ctaHref: "https://lisafitmethod.com/admin/coaching/check-ins",
    meta: {
      client: email,
      weight: parsedWeight != null ? `${parsedWeight} ${body.weightUnit || ""}` : null,
      "training performance": body.trainingPerformance ? `${body.trainingPerformance}/5` : null,
      "nutrition adherence": body.nutritionAdherence ? `${body.nutritionAdherence}/5` : null,
    },
  }).catch(() => {})

  return NextResponse.json({ checkIn })
}
