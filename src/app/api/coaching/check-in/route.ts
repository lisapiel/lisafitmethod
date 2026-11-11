import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { createCoachingCheckIn, listCoachingCheckIns, getCoachingClientRecord, getProgramRecord, hasCoachingAccess, listWorkoutLogRecords, type CoachingCheckInRecord } from "@/lib/authTokens"
import { notifyAdmin } from "@/lib/notifyAdmin"
import { ADJUSTMENT_AREAS, NUTRITION_STATUSES, normalizeCheckInWeight, parseHunger, parseNutritionNote, type NutritionStatus } from "@/lib/checkInAnswers"
import { isOwnClientKey } from "@/lib/mediaKeys"
import { parseProgressPhotosInput, phaseProgress, photoMilestone, type PhaseProgress } from "@/lib/progressPhotos"

export const dynamic = "force-dynamic"

const MAX_FORM_REVIEW_VIDEOS = 3
const FORM_REVIEW_PREFIX = "media/coaching-form-reviews/"

async function getSessionEmail(): Promise<string | null> {
  return (await getSessionIdentity())?.email ?? null
}

async function getSessionIdentity(): Promise<{ email: string; sub: string } | null> {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec): Promise<{ email: string; sub: string } | null> => {
      try {
        const payload = (await fetchAuthSession(contextSpec)).tokens?.idToken?.payload
        const email = payload?.email
        const sub = payload?.sub
        return typeof email === "string" && typeof sub === "string" ? { email, sub } : null
      } catch {
        return null
      }
    },
  })
}

// Where the client is in their current phase, from their own workout logs.
// Null when there's no current program or the lookup fails; photos and the
// check-in itself never depend on it.
async function currentPhase(email: string): Promise<PhaseProgress | null> {
  try {
    const client = await getCoachingClientRecord(email)
    if (!client?.currentProgramId) return null
    const [program, logs] = await Promise.all([getProgramRecord(client.currentProgramId), listWorkoutLogRecords(email)])
    return phaseProgress(program, logs.map((l) => ({ programId: l.programId, weekNumber: Number(l.weekNumber), dayLabel: l.dayLabel, completedAt: l.completedAt })))
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const checkIns = await listCoachingCheckIns(email)
  // The check-in form asks which friendly photo prompt to show, if any.
  if (req.nextUrl.searchParams.get("photoPrompt") === "1") {
    const photoPrompt = photoMilestone(await currentPhase(email), checkIns)
    return NextResponse.json({ checkIns, photoPrompt })
  }
  return NextResponse.json({ checkIns })
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}
function toInt1to5(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : undefined
}
function toNonNegativeInt(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n < 100 ? Math.round(n) : undefined
}

export async function POST(req: NextRequest) {
  const me = await getSessionIdentity()
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const email = me.email

  // Only active coaching clients submit new check-ins. The client-side layout
  // already redirects former clients away; this is server-side defense.
  const active = await hasCoachingAccess(email)
  if (!active) return NextResponse.json({ error: "Coaching access required" }, { status: 403 })

  const body = await req.json()

  // ── Measurements ────────────────────────────────────────────────────────
  type MeasurementIn = { label?: unknown; value?: unknown; unit?: unknown }
  const rawMeasurements = Array.isArray(body.measurements) ? body.measurements as MeasurementIn[] : []
  const measurements = rawMeasurements
    .map((m) => ({
      label: String(m.label ?? "").trim(),
      value: String(m.value ?? "").trim(),
      unit: String(m.unit ?? "").trim(),
    }))
    .filter((m) => m.label && m.value)

  // ── Weight: new reading, same as last time, or skipped ───────────────────
  const weightIn = normalizeCheckInWeight(body)
  if (!weightIn.ok) return NextResponse.json({ error: weightIn.error }, { status: 400 })
  const weightFields = weightIn.fields
  const parsedWeight = weightFields.weight

  // ── Schema version routing ──────────────────────────────────────────────
  // 2 = new redesigned check-in. Absent/1 = legacy (retained for any old
  // client cache still running the old form).
  const isV2 = Number(body.schemaVersion) === 2

  // ── v2: Form review video validation ────────────────────────────────────
  // Each formReview: { exercise: string, note?: string, videoKeys?: string[] }
  // Every videoKey must live under media/coaching-form-reviews/, in the
  // caller's own folder. Refuse anything else so a client can't reference
  // arbitrary paths or another client's videos.
  type FormReviewIn = { exercise?: unknown; note?: unknown; videoKeys?: unknown }
  let formReviewsJson: string | undefined
  let totalVideos = 0
  if (isV2 && Array.isArray(body.formReviews)) {
    const cleaned: Array<{ exercise: string; note: string; videoKeys: string[] }> = []
    for (const raw of body.formReviews as FormReviewIn[]) {
      const exercise = toStr(raw.exercise)
      const note = toStr(raw.note)
      const rawKeys = Array.isArray(raw.videoKeys)
        ? (raw.videoKeys as unknown[]).filter((k): k is string => typeof k === "string" && k.length > 0 && k.length <= 512)
        : []
      const validKeys = rawKeys.filter((k) => k.startsWith(FORM_REVIEW_PREFIX) && isOwnClientKey(k, me.sub, "form-review"))
      if (validKeys.length !== rawKeys.length) {
        return NextResponse.json({ error: "Invalid form-review video key" }, { status: 400 })
      }
      totalVideos += validKeys.length
      if (!exercise && validKeys.length === 0 && !note) continue
      cleaned.push({ exercise, note, videoKeys: validKeys })
    }
    if (totalVideos > MAX_FORM_REVIEW_VIDEOS) {
      return NextResponse.json({ error: `Max ${MAX_FORM_REVIEW_VIDEOS} form-review videos per check-in` }, { status: 400 })
    }
    if (cleaned.length > 0) formReviewsJson = JSON.stringify(cleaned)
  }

  // ── Optional progress photos: the caller's own, one per pose ────────────
  const photosIn = parseProgressPhotosInput(isV2 ? body.progressPhotos : undefined, me.sub)
  if (!photosIn.ok) return NextResponse.json({ error: photosIn.error }, { status: 400 })
  const progressPhotos = photosIn.value

  // ── Nutrition status enum ───────────────────────────────────────────────
  let nutritionStatus: NutritionStatus | undefined
  if (isV2 && typeof body.nutritionStatus === "string" && NUTRITION_STATUSES.includes(body.nutritionStatus as NutritionStatus)) {
    nutritionStatus = body.nutritionStatus as NutritionStatus
  }

  const nutritionNote = parseNutritionNote(isV2 ? body.nutritionNote : undefined)
  if (!nutritionNote.ok) return NextResponse.json({ error: nutritionNote.error }, { status: 400 })

  // ── Adjustment areas: comma-separated list of known tokens ───────────────
  let adjustmentAreas: string | undefined
  if (isV2 && Array.isArray(body.adjustmentAreas)) {
    const cleaned = (body.adjustmentAreas as unknown[])
      .filter((a): a is string => typeof a === "string")
      .filter((a) => (ADJUSTMENT_AREAS as readonly string[]).includes(a))
    if (cleaned.length > 0) adjustmentAreas = cleaned.join(",")
  }

  // ── Build the check-in record ───────────────────────────────────────────
  const shared: Partial<CoachingCheckInRecord> = {
    ...weightFields,
    ...(measurements.length > 0 && { measurementSnapshot: JSON.stringify(measurements) }),
  }

  let payload: Partial<CoachingCheckInRecord>
  if (isV2) {
    payload = {
      ...shared,
      schemaVersion: 2,
      // Training
      ...(toNonNegativeInt(body.workoutsCompleted) != null && { workoutsCompleted: toNonNegativeInt(body.workoutsCompleted) }),
      ...(toNonNegativeInt(body.workoutsPlanned) != null && { workoutsPlanned: toNonNegativeInt(body.workoutsPlanned) }),
      ...(toInt1to5(body.trainingRating) != null && { trainingRating: toInt1to5(body.trainingRating) }),
      ...(toStr(body.trainingWins) && { trainingWins: toStr(body.trainingWins) }),
      ...(toStr(body.trainingChallenges) && { trainingChallenges: toStr(body.trainingChallenges) }),
      // Attention
      ...(typeof body.painReported === "boolean" && { painReported: body.painReported }),
      ...(toStr(body.painNotes) && { painNotes: toStr(body.painNotes) }),
      // Form review
      ...(typeof body.formReviewRequested === "boolean" && { formReviewRequested: body.formReviewRequested }),
      ...(formReviewsJson && { formReviews: formReviewsJson }),
      // Recovery
      ...(toInt1to5(body.sleepQuality) != null && { sleepQuality: toInt1to5(body.sleepQuality) }),
      ...(toInt1to5(body.energyLevel) != null && { energyLevel: toInt1to5(body.energyLevel) }),
      ...(toInt1to5(body.stressLevel) != null && { stressLevel: toInt1to5(body.stressLevel) }),
      ...(toInt1to5(body.recoveryRating) != null && { recoveryRating: toInt1to5(body.recoveryRating) }),
      // Nutrition
      ...(nutritionStatus && { nutritionStatus }),
      ...(toStr(body.nutritionHelp) && { nutritionHelp: toStr(body.nutritionHelp) }),
      ...(parseHunger(body.hunger) && { hunger: parseHunger(body.hunger) }),
      ...(nutritionNote.value && { nutritionNote: nutritionNote.value }),
      // Weekly reflection
      ...(toStr(body.weeklyWin) && { weeklyWin: toStr(body.weeklyWin) }),
      ...(toStr(body.weeklyChallenge) && { weeklyChallenge: toStr(body.weeklyChallenge) }),
      ...(adjustmentAreas && { adjustmentAreas }),
      ...(toStr(body.adjustmentNotes) && { adjustmentNotes: toStr(body.adjustmentNotes) }),
      ...(toStr(body.questionForLisa) && { questionForLisa: toStr(body.questionForLisa) }),
      ...(progressPhotos.length > 0 && { progressPhotos: JSON.stringify(progressPhotos) }),
    }
  } else {
    // Legacy v1 shape — retained verbatim so any cached old client keeps working.
    payload = {
      ...shared,
      ...(toInt1to5(body.sleepQuality) != null && { sleepQuality: toInt1to5(body.sleepQuality) }),
      ...(toInt1to5(body.energyLevel) != null && { energyLevel: toInt1to5(body.energyLevel) }),
      ...(toInt1to5(body.hungerLevel) != null && { hungerLevel: toInt1to5(body.hungerLevel) }),
      ...(toInt1to5(body.stressLevel) != null && { stressLevel: toInt1to5(body.stressLevel) }),
      ...(toInt1to5(body.digestion) != null && { digestion: toInt1to5(body.digestion) }),
      ...(toInt1to5(body.trainingPerformance) != null && { trainingPerformance: toInt1to5(body.trainingPerformance) }),
      ...(toInt1to5(body.nutritionAdherence) != null && { nutritionAdherence: toInt1to5(body.nutritionAdherence) }),
      ...(toInt1to5(body.workoutConsistency) != null && { workoutConsistency: toInt1to5(body.workoutConsistency) }),
      ...(toStr(body.wins) && { wins: toStr(body.wins) }),
      ...(toStr(body.struggles) && { struggles: toStr(body.struggles) }),
      ...(toStr(body.questionsForCoach) && { questionsForCoach: toStr(body.questionsForCoach) }),
      ...(toStr(body.additionalNotes) && { additionalNotes: toStr(body.additionalNotes) }),
    }
  }

  const phase = await currentPhase(email)
  const checkIn = await createCoachingCheckIn({
    clientEmail: email.toLowerCase(),
    submittedAt: new Date().toISOString(),
    status: "PENDING",
    ...payload,
    ...(phase && { phaseProgramId: phase.programId, phaseWeek: phase.week, phaseWeeks: phase.weeks }),
  })

  // ── Admin notification (non-blocking) ───────────────────────────────────
  const client = await getCoachingClientRecord(email).catch(() => null)
  const clientName = client?.displayName || email

  // Notification excerpt + high-signal flags for the v2 flow.
  const flags: string[] = []
  const meta: Record<string, string | number | null | undefined> = {
    client: email,
    weight: parsedWeight != null
      ? `${parsedWeight} ${weightFields.weightUnit ?? ""}`
      : weightFields.weightStatus === "same" ? "same as last time" : weightFields.weightStatus === "skipped" ? "skipped" : null,
  }

  if (isV2) {
    if (typeof body.workoutsCompleted === "number") {
      meta["workouts completed"] = typeof body.workoutsPlanned === "number"
        ? `${body.workoutsCompleted} of ${body.workoutsPlanned}`
        : `${body.workoutsCompleted}`
    }
    if (body.painReported === true) flags.push("Pain/discomfort reported")
    if (body.formReviewRequested === true) flags.push(`Form review requested${totalVideos > 0 ? ` (${totalVideos} video${totalVideos === 1 ? "" : "s"})` : ""}`)
    if (Array.isArray(body.adjustmentAreas) && body.adjustmentAreas.filter((a: string) => a !== "none").length > 0) {
      flags.push("Program adjustment requested")
    }
    if (toStr(body.questionForLisa)) flags.push("Question for you")
    if (progressPhotos.length > 0) flags.push(`Progress photo${progressPhotos.length === 1 ? "" : "s"} added`)
    const excerptParts: string[] = []
    if (flags.length > 0) excerptParts.push(flags.join(" · "))
    for (const text of [body.weeklyWin, body.weeklyChallenge, body.questionForLisa].filter(Boolean)) {
      excerptParts.push(String(text).slice(0, 240))
    }
    const excerpt = excerptParts.length > 0 ? excerptParts.join("\n\n") : "(No text notes — see check-in for ratings + weight.)"
    notifyAdmin({
      kind: "check-in-received",
      subject: `Check-in from ${clientName}${flags.length > 0 ? " · " + flags[0] : ""}`,
      headline: `${clientName} submitted their weekly check-in`,
      body: excerpt,
      ctaLabel: "Review check-in",
      ctaHref: `https://lisafitmethod.com/admin/coaching/check-ins/${checkIn.id}`,
      meta,
    }).catch(() => {})
  } else {
    // Legacy notification path (unchanged wording).
    const excerpt = [body.wins, body.struggles, body.questionsForCoach].filter(Boolean).map((s: string) => String(s).slice(0, 220)).join("\n\n") || "(No text notes — see check-in for ratings + weight.)"
    notifyAdmin({
      kind: "check-in-received",
      subject: `Check-in from ${clientName}`,
      headline: `${clientName} submitted their weekly check-in`,
      body: excerpt,
      ctaLabel: "Review check-in",
      ctaHref: "https://lisafitmethod.com/admin/coaching/check-ins",
      meta: {
        ...meta,
        "training performance": body.trainingPerformance ? `${body.trainingPerformance}/5` : null,
        "nutrition adherence": body.nutritionAdherence ? `${body.nutritionAdherence}/5` : null,
      },
    }).catch(() => {})
  }

  return NextResponse.json({ checkIn })
}
