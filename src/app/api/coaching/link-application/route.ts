import { NextRequest, NextResponse } from "next/server"
import { getCoachingApplication, updateCoachingApplication, getCoachingClientRecord, createCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"
import { getSessionUser } from "@/lib/sessionUser"
import { resolveInvitationAccess } from "@/lib/coachingInvitation"
import { linkEmailToAccount } from "@/lib/accountLinks"
import { consumeInvitationToken } from "@/lib/invitationTokens"

export const dynamic = "force-dynamic"

// Claim an approved coaching invitation for the account you are signed in to.
//
// This is the deliberate, person-confirmed alternative to the old behaviour,
// which silently created a second account whenever someone applied under an
// address we had not seen. Nothing here matches on names, and nothing happens
// without both proofs:
//
//   1. the caller is authenticated as the account that will own it, and
//   2. they present the single-use token from the email we sent to the
//      applicant address.
//
// Knowing an application id is deliberately not enough. An id can be read over
// someone's shoulder or forwarded; on its own it would let any signed-in
// visitor attach another person's approved terms to their own account.
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const b = body as { applicationId?: string; token?: string }
  const applicationId = b.applicationId?.trim() ?? ""
  const token = b.token?.trim() ?? ""
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 })

  const application = await getCoachingApplication(applicationId)
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 })
  if (application.status !== "APPROVED") {
    return NextResponse.json({ error: "This application is not open for enrolment" }, { status: 403 })
  }

  const access = await resolveInvitationAccess(application, user)
  if (access === "owner") return NextResponse.json({ ok: true, alreadyLinked: true })
  if (access === "foreign") {
    return NextResponse.json({ error: "This invitation belongs to a different account" }, { status: 403 })
  }

  const applicantEmail = application.email.trim().toLowerCase()

  // Proof the caller received the approval email. Spent before anything is
  // written, so two racing requests cannot both link.
  const spent = await consumeInvitationToken(token, applicationId, "account-link")
  if (!spent.valid) {
    return NextResponse.json(
      {
        error: "Open the link in your approval email to connect this invitation to your account.",
        reason: spent.reason,
        needsToken: true,
      },
      { status: 403 },
    )
  }
  if (spent.token.email !== applicantEmail) {
    return NextResponse.json({ error: "This link does not match the invitation" }, { status: 403 })
  }

  const linkedAt = new Date().toISOString()

  try {
    await linkEmailToAccount({
      aliasEmail: applicantEmail,
      primaryEmail: user.email,
      primarySub: user.sub,
      method: "coaching-invitation",
      note: `Linked from coaching application ${applicationId}`,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: detail }, { status: 409 })
  }

  // `email` is left exactly as submitted — it is part of the application's
  // history and the earlier acceptance records point at it. Ownership is
  // recorded alongside it.
  await updateCoachingApplication(applicationId, {
    ownerEmail: user.email,
    ownerSub: user.sub,
    linkedAt,
    linkedMethod: "coaching-invitation",
  })

  // Carry the pending client record onto the owning account so the admin view
  // and the portal both follow the person rather than the address. The
  // original row is kept and marked, never deleted.
  const existingOwnerRecord = await getCoachingClientRecord(user.email).catch(() => null)
  const applicantRecord = await getCoachingClientRecord(applicantEmail).catch(() => null)
  if (!existingOwnerRecord && applicantRecord) {
    await createCoachingClientRecord({
      ...applicantRecord,
      email: user.email,
      createdAt: applicantRecord.createdAt ?? linkedAt,
    }).catch((err) => console.error("createCoachingClientRecord (link) failed:", err))
    await updateCoachingClientRecord(applicantEmail, {
      status: "INACTIVE",
      privateNotes: `Superseded ${linkedAt}: coaching moved to ${user.email} (application ${applicationId}).`,
    }).catch((err) => console.error("updateCoachingClientRecord (supersede) failed:", err))
  }

  return NextResponse.json({ ok: true, ownerEmail: user.email })
}
