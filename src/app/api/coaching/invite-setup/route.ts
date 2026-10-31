import { NextRequest, NextResponse } from "next/server"
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider"
import { Resend } from "resend"
import { getCoachingApplication, generateAuthToken, storeAuthToken } from "@/lib/authTokens"
import { applicationOwnerEmail } from "@/lib/coachingInvitation"

export const dynamic = "force-dynamic"

function makeCognito() {
  return new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

// Gives an approved applicant a way to get a login before they pay.
//
// The address is taken from the application, never from the request, so this
// cannot be pointed at anyone else: the only thing a caller can do is cause an
// email to be sent to the person who was already invited.
//
// This replaces the account that approval used to create silently. That one
// was created with a suppressed random password and no way to reach it, which
// is how a client ended up holding an invitation to an account that had never
// been issued credentials.
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
  const cognito = makeCognito()

  try {
    await cognito.send(new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
      Username: email,
    }))
  } catch {
    try {
      await cognito.send(new AdminCreateUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
        TemporaryPassword: `Lfm${Math.random().toString(36).slice(2, 10)}!A1`,
        MessageAction: "SUPPRESS",
      }))
    } catch (err) {
      if (!(err instanceof UsernameExistsException)) {
        console.error("Cognito account creation failed:", err)
        return NextResponse.json({ error: "Could not prepare the account" }, { status: 500 })
      }
    }
  }

  const token = generateAuthToken()
  await storeAuthToken(token, email, "setup")
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lisafitmethod.com"
  const redirect = encodeURIComponent(`/coaching/accept/${applicationId}`)
  const setPasswordUrl = `${baseUrl}/set-password?token=${token}&redirect=${redirect}`

  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "Set up your Lisa Fit Method login",
    html: `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:0;background:#f0ebe4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe4;padding:40px 20px;"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td align="center" style="padding-bottom:32px;">
        <span style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:0.04em;">Lisa <span style="color:#c9a96e;">Fit Method</span></span>
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:4px;padding:48px 44px;border-left:4px solid #c9a96e;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c9a96e;">Coaching</p>
        <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">Set up your login</h1>
        <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
          Choose a password for <strong style="color:#1a1a1a;">${email}</strong>. You'll come straight back to finish your coaching enrolment.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="background:#c9a96e;border-radius:2px;">
          <a href="${setPasswordUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Set Password &rarr;</a>
        </td></tr></table>
        <p style="margin:0;font-size:13px;color:#8a8a8a;line-height:1.7;">This link is good for 48 hours. Your coaching invitation itself does not expire — you can always come back to it.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  }).catch((err) => console.error("invite-setup email failed:", err))

  return NextResponse.json({ ok: true, sentTo: email })
}
