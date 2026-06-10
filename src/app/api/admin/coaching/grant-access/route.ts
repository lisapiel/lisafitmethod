import { NextRequest, NextResponse } from "next/server"
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider"
import { Resend } from "resend"
import { randomBytes } from "crypto"
import { grantCoachingAccess, generateAuthToken, storeAuthToken } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

const ADMIN_EMAIL = "lisa.p.mcpherson@gmail.com"

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
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghjkmnpqrstuvwxyz"
  const digits = "23456789"
  const special = "!@#$"
  const rand = (set: string) => set[randomBytes(1)[0] % set.length]
  const chars = [
    rand(upper), rand(upper),
    rand(lower), rand(lower), rand(lower),
    rand(digits), rand(digits), rand(digits),
    rand(special),
  ]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join("")
}

function coachingWelcomeEmail(name: string, setPasswordUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:0.04em;">
            Lisa <span style="color:#c8a97e;">Fit Method</span>
          </span>
        </td></tr>
        <tr><td style="background:#fff;padding:40px;border-radius:4px;">
          <p style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#1a1a1a;margin:0 0 16px;">
            Welcome to your coaching portal
          </p>
          <p style="font-size:15px;color:#6b6560;line-height:1.6;margin:0 0 24px;">
            Hi ${name},<br /><br />
            I'm so excited to start working with you! Your coaching portal is all set up — this is where you'll find your workouts, track your progress, submit your weekly check-ins, and message me directly.
          </p>
          <p style="font-size:15px;color:#6b6560;margin:0 0 28px;">
            Click below to set your password and access your portal:
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#c8a97e;border-radius:3px;">
                <a href="${setPasswordUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                  Set Your Password →
                </a>
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:#aaa;margin:0;">
            This link expires in 48 hours. Once you've set your password, log in at
            <a href="https://lisafitmethod.com/login" style="color:#c8a97e;">lisafitmethod.com/login</a>
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="font-size:12px;color:#aaa;margin:0;">
            Lisa Fit Method · lisafitmethod.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function coachingAccessGrantedEmail(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;">
            Lisa <span style="color:#c8a97e;">Fit Method</span>
          </span>
        </td></tr>
        <tr><td style="background:#fff;padding:40px;border-radius:4px;">
          <p style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#1a1a1a;margin:0 0 16px;">
            Your coaching portal is ready
          </p>
          <p style="font-size:15px;color:#6b6560;line-height:1.6;margin:0 0 28px;">
            Hi ${name},<br /><br />
            I'm so excited to start working with you! Your coaching portal is now active.
            Log in with your existing account to get started.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#c8a97e;border-radius:3px;">
                <a href="https://lisafitmethod.com/my-coaching" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                  Open Coaching Portal →
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    if (callerEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as { email: string; displayName: string; plan?: string; startDate?: string }
  if (!body.email || !body.displayName) {
    return NextResponse.json({ error: "Missing email or displayName" }, { status: 400 })
  }

  const email = body.email.trim().toLowerCase()
  const displayName = body.displayName.trim()
  const firstName = displayName.split(" ")[0]

  const cognito = makeCognito()
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")

  // Check if Cognito account already exists
  let accountExists = false
  try {
    await cognito.send(new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
      Username: email,
    }))
    accountExists = true
  } catch {
    accountExists = false
  }

  await grantCoachingAccess(email, body.plan, body.startDate)

  if (!accountExists) {
    // Create Cognito account with temp password
    try {
      await cognito.send(new AdminCreateUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
        TemporaryPassword: generateTempPassword(),
        MessageAction: "SUPPRESS",
      }))
    } catch (err) {
      if (!(err instanceof UsernameExistsException)) throw err
    }

    const token = generateAuthToken()
    await storeAuthToken(token, email, "setup")
    const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${token}`

    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      to: email,
      subject: "Welcome to Lisa Fit Method Coaching",
      html: coachingWelcomeEmail(firstName, setPasswordUrl),
    })

    return NextResponse.json({ ok: true, accountCreated: true })
  } else {
    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      to: email,
      subject: "Your coaching portal is ready",
      html: coachingAccessGrantedEmail(firstName),
    })

    return NextResponse.json({ ok: true, accountCreated: false })
  }
}
