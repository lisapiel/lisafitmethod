import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getCoachingApplication } from "@/lib/authTokens"
import { generateInvitationToken, storeInvitationToken } from "@/lib/invitationTokens"
import { applicationOwnerEmail } from "@/lib/coachingInvitation"

export const dynamic = "force-dynamic"

// Re-issues the single-use token for an invitation that is still open.
//
// Two people need this: anyone whose approval email predates tokens entirely
// (their link still works, it just carries no proof), and anyone whose token
// has been spent or has aged out. Neither needs a fresh approval — the
// invitation on the application record is untouched, and the offer stands.
//
// The address is read from the application, never from the request, so the
// only thing a caller can cause is a mail to the person already invited.
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const applicationId = (body as { applicationId?: string }).applicationId?.trim() ?? ""
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 })

  const application = await getCoachingApplication(applicationId)
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 })
  if (application.status !== "APPROVED") {
    return NextResponse.json({ error: "This application is not open for enrolment" }, { status: 403 })
  }

  const email = applicationOwnerEmail(application)
  const token = generateInvitationToken()
  await storeInvitationToken({ token, applicationId, email })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lisafitmethod.com"
  const link = `${baseUrl}/coaching/accept/${applicationId}?t=${token}`
  const firstName = application.name.split(" ")[0] || "there"

  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "Complete your coaching enrolment",
    html: `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:0;background:#f0ebe4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe4;padding:40px 20px;"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td align="center" style="padding-bottom:32px;">
        <span style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:0.04em;">Lisa <span style="color:#c9a96e;">Fit Method</span></span>
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:4px;padding:48px 44px;border-left:4px solid #c9a96e;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c9a96e;">Coaching</p>
        <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">Pick up where you left off, ${firstName}</h1>
        <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">Your place is still held. This link takes you straight to your enrolment.</p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="background:#c9a96e;border-radius:2px;">
          <a href="${link}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Complete Enrollment &rarr;</a>
        </td></tr></table>
        <p style="margin:0;font-size:13px;color:#8a8a8a;line-height:1.7;">For your security this particular link can only be used once. Your invitation itself doesn't expire — if you need another, just ask.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  }).catch((err) => console.error("invite-setup email failed:", err))

  return NextResponse.json({ ok: true, sentTo: email })
}
