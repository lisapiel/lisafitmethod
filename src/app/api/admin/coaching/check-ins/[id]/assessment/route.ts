import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { createCoachingMessage, getCoachingCheckIn, getCoachingClientRecord, updateCoachingCheckIn } from "@/lib/authTokens"
import { coachThreadId } from "@/lib/coachThreadKey"
import {
  assessmentEmailHtml, assessmentPlainText, getAssessment, putAssessment, shouldEmailAssessment,
  type AssessmentRecord, type AssessmentShared,
} from "@/lib/coachingRecords"

export const dynamic = "force-dynamic"

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "")

function readShared(body: Record<string, unknown>): AssessmentShared & { privateNote: string } {
  const priorities = Array.isArray(body.priorities) ? body.priorities.map((p) => clip(p, 200)).filter(Boolean).slice(0, 3) : []
  return { wentWell: clip(body.wentWell, 2000), toImprove: clip(body.toImprove, 2000), changes: clip(body.changes, 2000), priorities, privateNote: clip(body.privateNote, 4000) }
}

// GET: the full assessment for Lisa, including her private note.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  return NextResponse.json({ assessment: await getAssessment(id) })
}

// PUT: save a draft, or save edits. Editing an assessment that was already sent
// keeps the earlier shared text in `versions` and bumps the version, but posts
// nothing and emails nothing.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const checkIn = await getCoachingCheckIn(id)
  if (!checkIn) return NextResponse.json({ error: "Check-in not found" }, { status: 404 })
  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const next = readShared(body)
  const now = new Date().toISOString()
  const prev = await getAssessment(id)
  const changedShared = !!prev && prev.status === "sent" && (prev.wentWell !== next.wentWell || prev.toImprove !== next.toImprove || prev.changes !== next.changes || JSON.stringify(prev.priorities) !== JSON.stringify(next.priorities))
  const rec: AssessmentRecord = {
    ...(prev ?? { checkInId: id, clientEmail: checkIn.clientEmail.toLowerCase(), status: "draft", version: 0, createdAt: now }),
    ...next,
    updatedAt: now,
    emailRequested: typeof body.emailRequested === "boolean" ? body.emailRequested : prev?.emailRequested,
    snapshot: body.snapshot && typeof body.snapshot === "object" && JSON.stringify(body.snapshot).length < 4000 ? body.snapshot as Record<string, unknown> : prev?.snapshot,
  } as AssessmentRecord
  if (changedShared && prev) {
    rec.versions = [...(prev.versions ?? []), { wentWell: prev.wentWell, toImprove: prev.toImprove, changes: prev.changes, priorities: prev.priorities, version: prev.version, sentAt: prev.sentAt ?? prev.updatedAt }]
    rec.version = prev.version + 1
    // Priorities changed: their old ticks no longer match.
    if (JSON.stringify(prev.priorities) !== JSON.stringify(next.priorities)) rec.priorityChecks = {}
    await updateCoachingCheckIn(id, { coachFeedback: assessmentPlainText(rec) })
  }
  await putAssessment(rec)
  return NextResponse.json({ assessment: rec })
}

// POST: send to the client ({ send: true }) or email the current version
// ({ emailUpdate: true }). Sending never touches targets or programs.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const checkIn = await getCoachingCheckIn(id)
  const rec = await getAssessment(id)
  if (!checkIn || !rec) return NextResponse.json({ error: "Save the assessment first." }, { status: 404 })
  const body = await req.json().catch(() => ({})) as { send?: boolean; emailUpdate?: boolean; emailRequested?: boolean }
  const now = new Date().toISOString()

  if (body.send && rec.status !== "sent") {
    if (!rec.wentWell && !rec.toImprove && !rec.changes && rec.priorities.length === 0) return NextResponse.json({ error: "Write at least one part before sending." }, { status: 400 })
    rec.status = "sent"
    rec.sentAt = now
    rec.sentBy = admin.toLowerCase()
    rec.version = Math.max(1, rec.version)
    if (typeof body.emailRequested === "boolean") rec.emailRequested = body.emailRequested
    await updateCoachingCheckIn(id, { status: "REVIEWED", coachFeedback: assessmentPlainText(rec), reviewedAt: now })
    if (!rec.messageId) {
      const submitted = new Date(checkIn.submittedAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      const msg = await createCoachingMessage({
        threadId: coachThreadId(rec.clientEmail), fromEmail: admin.toLowerCase(), toEmail: rec.clientEmail,
        body: `I've shared my feedback on your check-in from ${submitted}. You'll find it on your Home page and under Check-in.`, sentAt: now,
      })
      rec.messageId = msg.id
    }
  }
  if (rec.status !== "sent") return NextResponse.json({ error: "Send the assessment before emailing it." }, { status: 400 })

  let email: "sent" | "skipped" | "not-requested" | "failed" = "not-requested"
  if (shouldEmailAssessment(rec, body.emailUpdate === true)) {
    const key = process.env.RESEND_API_KEY
    if (!key) email = "skipped"
    else {
      try {
        const client = await getCoachingClientRecord(rec.clientEmail)
        const first = (client?.displayName ?? "").split(" ")[0]
        await new Resend(key).emails.send({
          from: "Lisa Fit Method <noreply@lisafitmethod.com>", to: rec.clientEmail, subject: "Your week, from Lisa",
          html: assessmentEmailHtml(rec, first, "https://lisafitmethod.com/my-coaching"),
        })
        rec.emailedVersion = rec.version
        rec.emailedAt = now
        email = "sent"
      } catch { email = "failed" }
    }
  }
  rec.updatedAt = now
  await putAssessment(rec)
  return NextResponse.json({ assessment: rec, email })
}
