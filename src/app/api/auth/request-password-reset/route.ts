import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { Resend } from "resend"
import { generateAuthToken, storeAuthToken } from "@/lib/authTokens"

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

function resetEmail(email: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reset your password | Lisa Fit Method</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ebe4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ebe4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:0.04em;">
                Lisa <span style="color:#c9a96e;">Fit Method</span>
              </span>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:4px;padding:48px 44px;border-left:4px solid #c9a96e;">

              <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c9a96e;">
                Password Reset
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">
                Reset your password
              </h1>

              <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Click the button below to set a new password for <strong style="color:#1a1a1a;">${email}</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#c9a96e;border-radius:2px;">
                    <a href="${resetUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:12px;color:#999;line-height:1.7;">
                This link expires in 48 hours. If you didn&rsquo;t request a password reset, you can ignore this email.
              </p>

              <p style="margin:0;font-size:12px;color:#bbb;">
                Or copy this link into your browser:<br />
                <span style="color:#c9a96e;word-break:break-all;">${resetUrl}</span>
              </p>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:0.04em;">
                Lisa Fit Method &middot; lisafitmethod.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  let email: string
  try {
    const body = await request.json() as { email?: string }
    email = (body.email ?? "").trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

  // Check if user exists — silently succeed if not (don't reveal account existence)
  try {
    const cognito = makeCognito()
    await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Username: email,
      })
    )
  } catch {
    return NextResponse.json({ sent: true })
  }

  const token = generateAuthToken()
  await storeAuthToken(token, email, "reset")
  const resetUrl = `https://lisafitmethod.com/set-password?token=${token}`

  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    to: email,
    subject: "Reset your password | Lisa Fit Method",
    html: resetEmail(email, resetUrl),
  })

  return NextResponse.json({ sent: true })
}
