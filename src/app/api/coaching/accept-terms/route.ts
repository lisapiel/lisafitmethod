import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider"
import {
  getWaiverToken,
  markWaiverTokenUsed,
  recordTermsAcceptance,
  stampCoachingAccessVersions,
  TERMS_VERSION,
  LIABILITY_WAIVER_VERSION,
  generateAuthToken,
  storeAuthToken,
  isAdminEmail,
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

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  const symbols = "!@#$%&*"
  let pwd = ""
  for (let i = 0; i < 14; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  pwd += symbols[Math.floor(Math.random() * symbols.length)]
  return pwd
}

// POST /api/coaching/accept-terms
// Validates a one-time waiver token (generated via /api/admin/coaching/send-waiver-link),
// records the client's affirmative acceptance of the current Terms + Waiver,
// stamps the versions on their coaching_access_ record, and sends the
// appropriate onboarding email (set-password for new accounts, portal link for
// existing confirmed accounts).
// No payment changes of any kind.
export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const b = body as { token?: string }
  const rawToken = b.token?.trim() ?? ""
  if (!rawToken) return NextResponse.json({ error: "token required" }, { status: 400 })

  // Validate token
  const record = await getWaiverToken(rawToken)
  if (!record) return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 })
  if (record.used) return NextResponse.json({ error: "This link has already been used." }, { status: 400 })
  if (new Date(record.expiresAt) < new Date()) {
    return NextResponse.json({ error: "This link has expired. Please contact Lisa Fit Method for a new one." }, { status: 400 })
  }

  const email = record.email
  if (isAdminEmail(email)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  // Mark token used first to prevent replay (acceptance recording is idempotent by design)
  await markWaiverTokenUsed(rawToken)

  const forwardedFor = req.headers.get("x-forwarded-for") ?? ""
  const ipAddress = forwardedFor.split(",")[0].trim() || undefined
  const userAgent = req.headers.get("user-agent") ?? undefined

  // Record acceptance + stamp versions
  await recordTermsAcceptance({
    kind: "coaching-subscription",
    customerEmail: email,
    product: "coaching",
    termsVersion: TERMS_VERSION,
    liabilityWaiverVersion: LIABILITY_WAIVER_VERSION,
    ipAddress,
    userAgent,
    termsUrl: "/terms#coaching",
    liabilityWaiverUrl: "/terms#risk",
  })
  await stampCoachingAccessVersions(email, TERMS_VERSION, LIABILITY_WAIVER_VERSION)

  // Send onboarding email. For CONFIRMED accounts, send portal link.
  // For accounts in FORCE_CHANGE_PASSWORD (pre-created silently), send set-password link.
  // For non-existent accounts, create one first.
  if (!isAdminEmail(email)) {
    const cognito = makeCognito()
    const resend = new Resend(process.env.RESEND_API_KEY ?? "")
    const firstName = email.split("@")[0]

    let hasUsableLogin = false
    try {
      const user = await cognito.send(new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Username: email,
      }))
      hasUsableLogin = user.UserStatus === "CONFIRMED"
    } catch {
      hasUsableLogin = false
    }

    try {
      if (hasUsableLogin) {
        await resend.emails.send({
          from: "Lisa Fit Method <noreply@lisafitmethod.com>",
          replyTo: "contact@lisafitmethod.com",
          to: email,
          subject: "Your coaching portal is ready — Lisa Fit Method",
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
        <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">You're in, ${firstName}.</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#4a4a4a;line-height:1.7;">Your coaching portal is now active. Log in with your existing account to get started.</p>
        <table cellpadding="0" cellspacing="0"><tr><td style="background:#c8a97e;border-radius:2px;">
          <a href="https://lisafitmethod.com/my-coaching" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Open Coaching Portal →</a>
        </td></tr></table>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
        })
      } else {
        await cognito.send(new AdminCreateUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
          Username: email,
          UserAttributes: [
            { Name: "email", Value: email },
            { Name: "email_verified", Value: "true" },
          ],
          TemporaryPassword: generateTempPassword(),
          MessageAction: "SUPPRESS",
        })).catch((err: unknown) => {
          if (!(err instanceof UsernameExistsException)) throw err
        })

        const authToken = generateAuthToken()
        await storeAuthToken(authToken, email, "setup")
        const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${authToken}`

        await resend.emails.send({
          from: "Lisa Fit Method <noreply@lisafitmethod.com>",
          replyTo: "contact@lisafitmethod.com",
          to: email,
          subject: "Welcome to 1:1 Coaching — set up your account",
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
        <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">Welcome, ${firstName}. Let's get started.</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">Your terms have been accepted — set your password to access your coaching portal.</p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="background:#c8a97e;border-radius:2px;">
          <a href="${setPasswordUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Set Your Password →</a>
        </td></tr></table>
        <p style="margin:0;font-size:12px;color:#999;">This link expires in 48 hours. Email: <strong style="color:#888;">${email}</strong></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
        })
      }
    } catch (err) {
      console.error("Email send failed after accept-terms:", err)
    }
  }

  return NextResponse.json({ ok: true })
}
