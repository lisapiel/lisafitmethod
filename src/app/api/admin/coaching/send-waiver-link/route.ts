import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import {
  isAdminEmail,
  generateWaiverToken,
  storeWaiverToken,
  hasCoachingAccess,
} from "@/lib/authTokens"

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

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    return callerEmail != null && isAdminEmail(callerEmail)
  } catch {
    return false
  }
}

// POST /api/admin/coaching/send-waiver-link
// Generates a one-time waiver-acceptance token and emails it to a coaching
// client who paid but never completed the acceptance interstitial.
// The client must personally click the link and check both boxes.
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const b = body as { email?: string }
  const email = b.email?.trim().toLowerCase() ?? ""
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  if (isAdminEmail(email)) {
    return NextResponse.json({ error: "Cannot send waiver link to admin account" }, { status: 400 })
  }

  const hasAccess = await hasCoachingAccess(email)
  if (!hasAccess) {
    return NextResponse.json({
      error: `${email} does not have coaching access. Run the backfill tool first to grant access before sending the waiver link.`,
    }, { status: 400 })
  }

  const token = generateWaiverToken()
  await storeWaiverToken(token, email)

  const acceptUrl = `https://lisafitmethod.com/coaching/accept-terms?token=${token}`
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  const firstName = email.split("@")[0]

  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "Action required: accept your coaching terms — Lisa Fit Method",
    html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td align="center" style="padding-bottom:32px;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;">Lisa <span style="color:#c8a97e;">Fit Method</span></span>
      </td></tr>
      <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;border-left:4px solid #c8a97e;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">1:1 Coaching</p>
        <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1a1a1a;line-height:1.3;">One quick step before we begin, ${firstName}.</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">
          Your payment is confirmed and I'm ready to get started — I just need you to review and accept the Coaching Terms &amp; Conditions and Assumption of Risk &amp; Liability Waiver before I activate your portal.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#4a4a4a;line-height:1.7;">
          This only takes a moment. Click below to review and accept.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="background:#c8a97e;border-radius:2px;">
          <a href="${acceptUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Review &amp; Accept →</a>
        </td></tr></table>
        <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">This link expires in 48 hours. If it has expired, please contact us at <a href="mailto:contact@lisafitmethod.com" style="color:#c8a97e;">contact@lisafitmethod.com</a> and we'll send a new one.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  })

  return NextResponse.json({
    ok: true,
    message: `Waiver acceptance link sent to ${email}. The link expires in 48 hours.`,
  })
}
