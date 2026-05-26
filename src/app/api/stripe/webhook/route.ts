import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider"
import { Resend } from "resend"
import { randomBytes } from "crypto"
import { generateAuthToken, storeAuthToken } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

function makeStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
}

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

function welcomeEmail(email: string, setPasswordUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your Training Foundations course is ready!</title>
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

              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="width:64px;vertical-align:middle;">
                    <img src="https://lisafitmethod.com/lisa-email.jpg" alt="Lisa McPherson" width="56" height="56" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block;" />
                  </td>
                  <td style="padding-left:16px;vertical-align:middle;">
                    <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">Lisa McPherson</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#888;">Certified Personal Trainer</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c9a96e;">
                Training Foundations
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">
                Your course is ready.
              </h1>

              <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Really excited for you to get started on this. Click below to set your password and get instant access.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background:#c9a96e;border-radius:2px;">
                    <a href="${setPasswordUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                      Set Your Password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:12px;color:#999;">
                This link expires in 48 hours. Your email address is: <strong style="color:#888;">${email}</strong>
              </p>

              <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Start with the Introduction before jumping into the modules. Watch every video — the foundation knowledge is what everything else is built on.
              </p>

              <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Any questions along the way, DM me on Instagram or TikTok
                <a href="https://www.instagram.com/lisafitmethod" style="color:#c9a96e;text-decoration:none;">@lisafitmethod</a>,
                or reach me through the
                <a href="https://lisafitmethod.com/contact" style="color:#c9a96e;text-decoration:none;">contact form on the website</a>.
                I also work with people 1:1 if you ever want something more personalised.
              </p>

              <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.7;">
                Now go do the work.<br />
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c9a96e;">Lisa</span>
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

async function provisionUser(email: string) {
  const cognito = makeCognito()
  const tempPassword = generateTempPassword()

  try {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
        TemporaryPassword: tempPassword,
        MessageAction: "SUPPRESS",
      })
    )
  } catch (error) {
    if (!(error instanceof UsernameExistsException)) throw error
    // Already purchased — account exists, just send a new set-password link
  }

  const token = generateAuthToken()
  await storeAuthToken(token, email, "setup")
  const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${token}`

  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    to: email,
    subject: "Your Training Foundations course is ready!",
    html: welcomeEmail(email, setPasswordUrl),
  })
}

export async function POST(request: NextRequest) {
  const stripe = makeStripe()
  const body = await request.text()
  const signature = request.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    )
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent
    const email = intent.metadata?.customerEmail

    if (email) {
      try {
        await provisionUser(email)
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        console.error("User provisioning failed:", detail)
        return NextResponse.json({ error: "Account setup failed", detail }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
