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
  const whatHaveYouTried = b.whatHaveYouTried?.trim() ?? ""

  if (!name || !email || !primaryGoal) {
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
    whyCoaching: whatHaveYouTried,
    trainingExperience: b.trainingExperience?.trim(),
    primaryGoal,
    daysPerWeek: b.daysPerWeek?.trim(),
    equipment: b.equipment?.trim(),
    injuries: b.injuries?.trim(),
    whatHaveYouTried,
    investmentReadiness: b.investmentReadiness?.trim(),
    startTiming: b.startTiming?.trim(),
  })

  await notifyAdmin({
    kind: "application-received",
    subject: `New coaching application from ${name}`,
    headline: `${name} applied for 1:1 coaching`,
    body: `Goal: ${primaryGoal}\n\nWhat they've tried: ${whatHaveYouTried || "(nothing shared)"}`,
    ctaLabel: "Review application",
    ctaHref: "https://lisafitmethod.com/admin/coaching/applications",
    meta: {
      email,
      "training experience": b.trainingExperience ?? "—",
      "primary goal": primaryGoal,
      "days per week": b.daysPerWeek ?? "—",
      equipment: b.equipment ?? "—",
      "injuries / limitations": b.injuries || "None mentioned",
      "investment readiness": b.investmentReadiness ?? "—",
      "start timing": b.startTiming ?? "—",
    },
  })

  return NextResponse.json({ ok: true })
}
