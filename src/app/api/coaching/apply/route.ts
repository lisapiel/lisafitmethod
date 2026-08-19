import { NextRequest, NextResponse } from "next/server"
import { submitCoachingApplication, listCoachingApplications } from "@/lib/authTokens"
import { notifyAdmin } from "@/lib/notifyAdmin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const b = body as Record<string, string | undefined>
  const s = (v: string | undefined) => v?.trim() ?? ""

  const name = s(b.name)
  const email = s(b.email).toLowerCase()
  const primaryGoal = s(b.primaryGoal)
  const primaryGoalOther = s(b.primaryGoalOther)
  const specificOutcome = s(b.specificOutcome)
  const trainingExperience = s(b.trainingExperience)
  const currentTraining = s(b.currentTraining)
  const daysPerWeek = s(b.daysPerWeek)
  const sessionDuration = s(b.sessionDuration)
  const equipment = s(b.equipment)
  const equipmentDetails = s(b.equipmentDetails)
  const injuries = s(b.injuries)
  const exercisePreferences = s(b.exercisePreferences)
  const scheduleConstraints = s(b.scheduleConstraints)
  const whyCoachingNow = s(b.whyCoachingNow)
  const coachingOption = s(b.coachingOption)
  const startTiming = s(b.startTiming)

  // Required set — matches the client-side `required` flags so a hand-crafted
  // POST can't sidestep them.
  if (
    !name || !email ||
    !primaryGoal || !specificOutcome ||
    !trainingExperience || !currentTraining || !daysPerWeek || !sessionDuration ||
    !equipment || !injuries || !whyCoachingNow ||
    !coachingOption || !startTiming
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  if (primaryGoal === "Other" && !primaryGoalOther) {
    return NextResponse.json({ error: "Please tell me what you want to achieve" }, { status: 400 })
  }
  if (equipment === "Other / limited setup" && !equipmentDetails) {
    return NextResponse.json({ error: "Please describe your equipment" }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  // Duplicate application guard — unchanged.
  const existing = await listCoachingApplications()
  const dupe = existing.find(
    (a) => a.email === email && (a.status === "PENDING" || a.status === "APPROVED" || a.status === "PAID")
  )
  if (dupe) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  // Legacy-required schema fields kept populated for back-compat.
  const legacyGoals = primaryGoal === "Other" ? primaryGoalOther : primaryGoal

  await submitCoachingApplication({
    email,
    name,
    goals: legacyGoals,
    currentFitnessLevel: trainingExperience,
    whyCoaching: whyCoachingNow,
    primaryGoal,
    primaryGoalOther: primaryGoalOther || undefined,
    specificOutcome,
    trainingExperience,
    currentTraining,
    daysPerWeek,
    sessionDuration,
    equipment,
    equipmentDetails: equipmentDetails || undefined,
    injuries,
    exercisePreferences: exercisePreferences || undefined,
    scheduleConstraints: scheduleConstraints || undefined,
    whyCoachingNow,
    coachingOption,
    startTiming,
  })

  const goalForDisplay = primaryGoal === "Other" ? `Other — ${primaryGoalOther}` : primaryGoal

  await notifyAdmin({
    kind: "application-received",
    subject: `New coaching application from ${name}`,
    headline: `${name} applied for 1:1 coaching`,
    body: `Primary goal: ${goalForDisplay}\n\nWants to achieve: ${specificOutcome}\n\nWhy coaching now: ${whyCoachingNow}`,
    ctaLabel: "Review application",
    ctaHref: "https://lisafitmethod.com/admin/coaching/applications",
    meta: {
      email,
      "primary goal": goalForDisplay,
      "specific outcome": specificOutcome,
      experience: trainingExperience,
      "current training": currentTraining,
      "days per week": daysPerWeek,
      "session duration": sessionDuration,
      equipment: equipmentDetails ? `${equipment} — ${equipmentDetails}` : equipment,
      "injuries / limitations": injuries || "None mentioned",
      "exercise preferences": exercisePreferences || "—",
      "schedule constraints": scheduleConstraints || "—",
      "why coaching now": whyCoachingNow,
      "coaching option": coachingOption,
      "start timing": startTiming,
    },
  })

  return NextResponse.json({ ok: true })
}
