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

  const b = body as Record<string, string>

  const name = b.name?.trim() ?? ""
  const email = b.email?.trim().toLowerCase() ?? ""
  const primaryGoal = b.primaryGoal?.trim() ?? ""
  const whyNow = b.whyNow?.trim() ?? ""

  if (!name || !email || !primaryGoal || !whyNow) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  // Check for duplicate application
  const existing = await listCoachingApplications()
  const dupe = existing.find(
    (a) => a.email === email && (a.status === "PENDING" || a.status === "APPROVED" || a.status === "PAID")
  )
  if (dupe) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  await submitCoachingApplication({
    email,
    name,
    goals: primaryGoal,
    currentFitnessLevel: b.trainingExperience?.trim() ?? "",
    whyCoaching: whyNow,
    trainingExperience: b.trainingExperience?.trim(),
    primaryGoal,
    whyNow,
    daysPerWeek: b.daysPerWeek?.trim(),
    equipment: b.equipment?.trim(),
    injuries: b.injuries?.trim(),
    coursesCompleted: b.coursesCompleted?.trim(),
    coachingOption: b.coachingOption?.trim(),
    whyLisa: b.whyLisa?.trim(),
  })

  await notifyAdmin({
    kind: "application-received",
    subject: `New coaching application — ${name}`,
    headline: `${name} applied for 1:1 coaching`,
    body: `Goal: ${primaryGoal}\n\n${whyNow}`,
    ctaLabel: "Review application",
    ctaHref: "https://lisafitmethod.com/admin/coaching/applications",
    meta: {
      email,
      "training experience": b.trainingExperience ?? "—",
      "primary goal": primaryGoal,
      "days per week": b.daysPerWeek ?? "—",
      equipment: b.equipment ?? "—",
      "injuries / limitations": b.injuries || "None mentioned",
      "courses completed": b.coursesCompleted ?? "—",
      "coaching option": b.coachingOption ?? "—",
      "why Lisa": b.whyLisa?.substring(0, 300) ?? "—",
    },
  })

  return NextResponse.json({ ok: true })
}
