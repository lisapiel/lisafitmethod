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

  const { name, email, goals, currentFitnessLevel, whyCoaching } = body as Record<string, string>

  if (!name?.trim() || !email?.trim() || !goals?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const emailLower = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  // Check for duplicate application
  const existing = await listCoachingApplications()
  const dupe = existing.find(
    (a) => a.email === emailLower && (a.status === "PENDING" || a.status === "APPROVED" || a.status === "PAID")
  )
  if (dupe) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  await submitCoachingApplication({
    email: emailLower,
    name: name.trim(),
    goals: goals.trim(),
    currentFitnessLevel: (currentFitnessLevel ?? "").trim(),
    whyCoaching: (whyCoaching ?? "").trim(),
  })

  await notifyAdmin({
    kind: "application-received",
    subject: `New coaching application — ${name.trim()}`,
    headline: `${name.trim()} applied for 1:1 coaching`,
    body: goals.trim(),
    ctaLabel: "Review application",
    ctaHref: "https://lisafitmethod.com/admin/coaching/applications",
    meta: {
      email: emailLower,
      "fitness level": (currentFitnessLevel ?? "").trim() || "—",
      "why coaching": (whyCoaching ?? "").trim() || "—",
    },
  })

  return NextResponse.json({ ok: true })
}
