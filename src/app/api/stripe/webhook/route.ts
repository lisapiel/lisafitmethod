import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider"
import { Resend } from "resend"
import { randomBytes } from "crypto"
import { notifyAdmin } from "@/lib/notifyAdmin"
import {
  generateAuthToken, storeAuthToken,
  grantTrainingAccess, grantTrackerAccess, grantNutritionAccess,
  grantMasterclassAccess, renewMasterclassAccess, revokeMasterclassAccess,
  grantCoachingAccess, revokeCoachingAccess, updateCoachingApplication, createCoachingClientRecord,
  getCoachingClientRecord, updateCoachingClientRecord,
  recordBundlePurchase, markBundleCreditUsed,
  stampCoachingAccessVersions, TERMS_VERSION, LIABILITY_WAIVER_VERSION,
} from "@/lib/authTokens"

export const dynamic = "force-dynamic"

function makeStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
}

// Stripe v22+ (API 2025-09-30) moved current_period_end off the top-level
// Subscription onto its items. Handle both shapes so we don't return NaN
// dates that get written into DynamoDB.
function extractCurrentPeriodEnd(subscription: Stripe.Subscription): number | null {
  const legacy = (subscription as unknown as { current_period_end?: number }).current_period_end
  if (typeof legacy === "number" && legacy > 0) return legacy
  const items = subscription.items?.data ?? []
  for (const item of items) {
    const cpe = (item as unknown as { current_period_end?: number }).current_period_end
    if (typeof cpe === "number" && cpe > 0) return cpe
  }
  return null
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
                Start with the Introduction before jumping into the modules. Watch every video. The foundation knowledge is what everything else is built on.
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

function nutritionWelcomeEmail(email: string, setPasswordUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your Nutrition Foundations course is ready!</title>
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
                Nutrition Foundations
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">
                Your course is ready.
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Really glad you&apos;re here. Click below to set your password and access your 4-week Nutrition Foundations course.
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
                This link expires in 48 hours. Your email: <strong style="color:#888;">${email}</strong>
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Start with Module 1. It has the TDEE calculator that personalises your meal plan. Fill it in before you open Module 3.
              </p>
              <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.7;">
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

function nutritionAccessGrantedEmail(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Nutrition Foundations: access added</title>
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
                Nutrition Foundations
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">
                Your nutrition course is ready.
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Nutrition Foundations has been added to your existing account. Log in with your current credentials to access it.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#c9a96e;border-radius:2px;">
                    <a href="https://lisafitmethod.com/nutrition-foundations" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                      Open Your Course →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.7;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c9a96e;">Lisa</span>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:0.04em;">Lisa Fit Method &middot; lisafitmethod.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function provisionNutritionUser(email: string) {
  const cognito = makeCognito()
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")

  // Check if user already exists
  let userExists = false
  try {
    await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Username: email,
      })
    )
    userExists = true
  } catch {
    // User does not exist
  }

  await grantNutritionAccess(email)

  if (userExists) {
    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      replyTo: "contact@lisafitmethod.com",
      to: email,
      subject: "Nutrition Foundations: your course is ready",
      html: nutritionAccessGrantedEmail(),
    })
    return
  }

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
    await grantNutritionAccess(email)
    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      replyTo: "contact@lisafitmethod.com",
      to: email,
      subject: "Nutrition Foundations: your course is ready",
      html: nutritionAccessGrantedEmail(),
    })
    return
  }

  const token = generateAuthToken()
  await storeAuthToken(token, email, "setup")
  const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${token}&redirect=${encodeURIComponent("/nutrition-foundations")}`

  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "Your Nutrition Foundations course is ready!",
    html: nutritionWelcomeEmail(email, setPasswordUrl),
  })
}

async function sendTrackerConfirmationEmail(email: string) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "Your Workout Tracker is ready!",
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f0ebe4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ebe4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:0.04em;">
            Lisa <span style="color:#c9a96e;">Fit Method</span>
          </span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:4px;padding:48px 44px;border-left:4px solid #c9a96e;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c9a96e;">
            My Workout Tracker
          </p>
          <h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">
            Your tracker is ready.
          </h1>
          <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            It's yours to keep. Log in to your Lisa Fit Method account and head to My Workout Tracker to start building your program.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td style="background:#c9a96e;border-radius:2px;">
              <a href="https://lisafitmethod.com/my-tracker" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                Open My Tracker →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.7;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c9a96e;">Lisa</span>
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:0.04em;">Lisa Fit Method &middot; lisafitmethod.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
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

  await grantTrainingAccess(email)

  const token = generateAuthToken()
  await storeAuthToken(token, email, "setup")
  const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${token}&redirect=${encodeURIComponent("/training-foundations")}`

  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "Your Training Foundations course is ready!",
    html: welcomeEmail(email, setPasswordUrl),
  })
}

function masterclassWelcomeEmail(email: string, setPasswordUrl: string | null): string {
  const ctaBlock = setPasswordUrl
    ? `<table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td style="background:#c9a96e;border-radius:2px;">
            <a href="${setPasswordUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
              Set Your Password →
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 32px;font-size:12px;color:#999;">
        This link expires in 48 hours. Your email: <strong style="color:#888;">${email}</strong>
      </p>`
    : `<table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td style="background:#c9a96e;border-radius:2px;">
            <a href="https://lisafitmethod.com/masterclass" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
              Open Masterclass →
            </a>
          </td>
        </tr>
      </table>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to Lisa Fit Method Masterclass</title>
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
                Masterclass
              </p>
              <h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">
                You&apos;re in.
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Welcome to Masterclass. A fresh program block drops at the start of every month, all built from real exercise videos so you know exactly what you&apos;re doing. New Q&amp;A answered monthly.
              </p>
              ${ctaBlock}
              <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Questions? DM me on Instagram or TikTok
                <a href="https://www.instagram.com/lisafitmethod" style="color:#c9a96e;text-decoration:none;">@lisafitmethod</a>.
              </p>
              <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.7;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c9a96e;">Lisa</span>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:0.04em;">Lisa Fit Method &middot; lisafitmethod.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function masterclassDunningEmail(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f0ebe4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ebe4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:0.04em;">
            Lisa <span style="color:#c9a96e;">Fit Method</span>
          </span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:4px;padding:48px 44px;border-left:4px solid #c9a96e;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c9a96e;">Masterclass</p>
          <h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">
            Payment issue on your account
          </h1>
          <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            We couldn&apos;t process your Masterclass payment. Update your card to keep your access. No data is lost.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td style="background:#c9a96e;border-radius:2px;">
              <a href="https://lisafitmethod.com/masterclass/subscribe" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                Update Payment →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;color:#999;">Account: ${email}</p>
        </td></tr>
        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:0.04em;">Lisa Fit Method &middot; lisafitmethod.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function provisionMasterclassUser(
  email: string,
  stripeSubscriptionId: string,
  plan: string,
  currentPeriodEnd: number
) {
  const cognito = makeCognito()
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  const periodEndIso = new Date(currentPeriodEnd * 1000).toISOString()
  const normalizedPlan = (plan === "monthly" || plan === "6month" || plan === "annual") ? plan : "monthly"

  // Check if user already exists
  let userExists = false
  try {
    await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Username: email,
      })
    )
    userExists = true
  } catch {
    // User does not exist
  }

  await grantMasterclassAccess(email, stripeSubscriptionId, normalizedPlan, periodEndIso)

  if (userExists) {
    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      replyTo: "contact@lisafitmethod.com",
      to: email,
      subject: "Welcome to Lisa Fit Method Masterclass",
      html: masterclassWelcomeEmail(email, null),
    })
    return
  }

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
  }

  const token = generateAuthToken()
  await storeAuthToken(token, email, "setup")
  const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${token}&redirect=${encodeURIComponent("/masterclass")}`

  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "Welcome to Lisa Fit Method Masterclass",
    html: masterclassWelcomeEmail(email, setPasswordUrl),
  })
}

function coachingPaymentFailedEmail(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:0.04em;">
            Lisa <span style="color:#c8a97e;">Fit Method</span>
          </span>
        </td></tr>
        <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;border-left:4px solid #c8a97e;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">1:1 Coaching</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1a1a1a;">Payment issue on your account</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            We couldn't process your coaching membership payment. Please update your payment method to keep your access. No data is lost.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#c8a97e;border-radius:2px;">
              <a href="https://lisafitmethod.com/account" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                Update Payment →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;color:#999;">Account: ${email}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function provisionCoachingSubscriber(email: string, name: string, subscriptionId?: string, commitmentType?: "THREE_MONTH_MINIMUM" | "MONTH_TO_MONTH") {
  const cognito = makeCognito()
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  const firstName = name.split(" ")[0] || "there"

  // Idempotency: subscription-create can be delivered by both
  // checkout.session.completed AND invoice.paid. We want the first one to
  // fully provision and the second (or a retry) to be a no-op — no duplicate
  // welcome emails, no duplicate admin notifications.
  const preexisting = await getCoachingClientRecord(email)
  if (preexisting?.status === "ACTIVE") {
    // Still refresh bundle-credit-used marker in case the first pass missed it
    if (subscriptionId) {
      await markBundleCreditUsed(email, subscriptionId).catch(() => { /* no bundle purchase — nothing to mark */ })
    }
    return
  }

  await grantCoachingAccess(email, "monthly")
  // Stamp the current terms versions on the access record so the portal
  // layout check passes without requiring reacceptance for new clients.
  await stampCoachingAccessVersions(email, TERMS_VERSION, LIABILITY_WAIVER_VERSION).catch(() => {})
  // If a bundle credit was applied, mark it used so it can't be reused
  if (subscriptionId) {
    await markBundleCreditUsed(email, subscriptionId).catch(() => { /* no bundle purchase record — nothing to mark */ })
  }

  // Resolve Stripe subscription start date for commitment window tracking
  let subscriptionStartDate: string | undefined
  if (subscriptionId) {
    try {
      const stripe = makeStripe()
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      subscriptionStartDate = new Date(sub.start_date * 1000).toISOString()
    } catch (err) {
      console.error("provisionCoachingSubscriber: could not retrieve subscription start_date", err)
    }
  }

  // Promote existing PENDING_PAYMENT record to ACTIVE; otherwise create new ACTIVE record.
  // Store commitment fields on the client record — these come from Stripe session metadata
  // which was populated at admin approval time, never derived from price.
  const commitmentUpdates = {
    ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    ...(subscriptionStartDate ? { subscriptionStartDate } : {}),
    ...(commitmentType ? {
      commitmentType,
      commitmentMonths: commitmentType === "THREE_MONTH_MINIMUM" ? 3 : 0,
    } : {}),
  }
  const wasNew = !preexisting
  if (preexisting) {
    await updateCoachingClientRecord(email, { status: "ACTIVE", ...commitmentUpdates })
  } else {
    await createCoachingClientRecord({ email, displayName: name, status: "ACTIVE", ...commitmentUpdates })
  }

  // Notify Lisa that a new client is active
  notifyAdmin({
    kind: "subscriber-active",
    subject: `${name} is now active on 1:1 coaching`,
    headline: `${name} just paid — they're active on 1:1 coaching`,
    body: wasNew
      ? "This is a new client. Their coaching portal is unlocked. Time to build them a program."
      : "Their PENDING_PAYMENT status just flipped to ACTIVE. Their coaching portal is unlocked.",
    ctaLabel: "Open client profile",
    ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}`,
    meta: { email },
  }).catch(() => {})

  // Distinguish "confirmed account with a real password" from "silently
  // pre-created account that was never delivered credentials." The approval
  // flow always pre-creates the Cognito account with MessageAction: SUPPRESS,
  // so a new coaching client's account exists but sits in FORCE_CHANGE_PASSWORD
  // until they set a password. Treat FORCE_CHANGE_PASSWORD as new-user so we
  // send them the set-password link instead of telling them to log in with
  // credentials they never received.
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

  if (hasUsableLogin) {
    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      replyTo: "contact@lisafitmethod.com",
      to: email,
      subject: "Your coaching is ready :)",
      html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;">Lisa <span style="color:#c8a97e;">Fit Method</span></span>
        </td></tr>
        <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;border-left:4px solid #c8a97e;">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="width:56px;vertical-align:middle;"><img src="https://lisafitmethod.com/lisa-email.jpg" alt="Lisa" width="48" height="48" style="width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;" /></td>
              <td style="padding-left:14px;vertical-align:middle;"><p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">Lisa McPherson</p><p style="margin:2px 0 0;font-size:12px;color:#888;">Certified Personal Trainer</p></td>
            </tr>
          </table>
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">Welcome to Coaching</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">Let's get to work ${firstName} !</h1>
          <p style="margin:0 0 18px;font-size:15px;color:#4a4a4a;line-height:1.7;">Your coaching is active and I'm excited to get started with you.</p>
          <p style="margin:0 0 18px;font-size:15px;color:#4a4a4a;line-height:1.7;">From here, my job is to take what you shared in your application and turn it into a plan that actually fits you. Not a list of random hard workouts, but a program with structure, progression, and a reason behind what you're doing.</p>
          <p style="margin:0 0 18px;font-size:15px;color:#4a4a4a;line-height:1.7;">Your coaching portal is where we'll keep everything together: your workouts, check-ins, progress, nutrition support, form reviews, and messages with me.</p>
          <p style="margin:0 0 28px;font-size:15px;color:#4a4a4a;line-height:1.7;">I'll start building your program right away using everything you shared in your application, and it'll show up in your portal as soon as it's ready.</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr><td style="background:#c8a97e;border-radius:2px;">
            <a href="https://lisafitmethod.com/my-coaching" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Open My Coaching Portal →</a>
          </td></tr></table>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
            <tr><td style="background:#faf8f5;border-left:3px solid #c8a97e;padding:16px 18px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#c8a97e;">One Quick Tip</p>
              <p style="margin:0 0 8px;font-size:15px;color:#4a4a4a;line-height:1.7;">If you haven't already, add Lisa Fit Method to your phone.</p>
              <p style="margin:0 0 8px;font-size:15px;color:#4a4a4a;line-height:1.7;">On iPhone, open it in Safari, tap Share → Add to Home Screen, make sure Open as Web App is turned on, then tap Add.</p>
              <p style="margin:0;font-size:15px;color:#4a4a4a;line-height:1.7;">It'll open like an app and makes everything much easier to access when you're training.</p>
            </td></tr>
          </table>
          <p style="margin:0 0 4px;font-size:14px;color:#4a4a4a;line-height:1.7;">Can't wait to get started.</p>
          <p style="margin:0;font-size:14px;color:#4a4a4a;font-family:Georgia,'Times New Roman',serif;font-style:italic;">Lisa</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })
    return
  }

  // New user — create account and send set-password link
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
  // ?redirect= carries the product-specific portal so the set-password
  // page lands the client where they actually purchased, instead of the
  // hardcoded /training-foundations fallback that dropped Isaac into a
  // course he hadn't bought.
  const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${token}&redirect=${encodeURIComponent("/my-coaching")}`

  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "You're in :) Let's get to work!",
    html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;">Lisa <span style="color:#c8a97e;">Fit Method</span></span>
        </td></tr>
        <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;border-left:4px solid #c8a97e;">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="width:56px;vertical-align:middle;"><img src="https://lisafitmethod.com/lisa-email.jpg" alt="Lisa" width="48" height="48" style="width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;" /></td>
              <td style="padding-left:14px;vertical-align:middle;"><p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">Lisa McPherson</p><p style="margin:2px 0 0;font-size:12px;color:#888;">Certified Personal Trainer</p></td>
            </tr>
          </table>
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">Welcome to Coaching</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">Welcome ${firstName} :)</h1>
          <p style="margin:0 0 18px;font-size:15px;color:#4a4a4a;line-height:1.7;">I'm really excited to have you here.</p>
          <p style="margin:0 0 18px;font-size:15px;color:#4a4a4a;line-height:1.7;">You've already done the hardest part, deciding you're ready to stop winging it and start training with a plan that actually has a reason behind it.</p>
          <p style="margin:0 0 18px;font-size:15px;color:#4a4a4a;line-height:1.7;">From here, I'll take everything you shared with me and turn it into something built around you. Your goals, your experience, your schedule, your equipment, your limitations, and the way you actually like to train.</p>
          <p style="margin:0 0 28px;font-size:15px;color:#4a4a4a;line-height:1.7;">We'll have structure, we'll track what's working, and we'll adjust as you progress.</p>

          <p style="margin:24px 0 10px;font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#c8a97e;">Next Steps</p>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">Here's what happens next:</p>

          <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1a1a1a;">1. Set your password</p>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">Use the button below to access your Lisa Fit Method coaching portal. This is where your workouts, check-ins, progress, nutrition support, form reviews, and messages with me all live.</p>

          <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1a1a1a;">2. I'll build your program</p>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">I'll start building it right away using everything you shared in your application, and you'll see it directly in your portal as soon as it's ready.</p>

          <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1a1a1a;">3. Add Lisa Fit Method to your phone</p>
          <p style="margin:0 0 8px;font-size:15px;color:#4a4a4a;line-height:1.7;">I definitely recommend this. On iPhone, open Lisa Fit Method in Safari, tap Share → Add to Home Screen, make sure Open as Web App is turned on, then tap Add.</p>
          <p style="margin:0 0 28px;font-size:15px;color:#4a4a4a;line-height:1.7;">It'll sit right on your Home Screen and open like an app, which makes it much easier to use when you're training.</p>

          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="background:#c8a97e;border-radius:2px;">
            <a href="${setPasswordUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Set My Password →</a>
          </td></tr></table>

          <p style="margin:0 0 4px;font-size:12px;color:#999;">This link expires in 48 hours.</p>
          <p style="margin:0 0 22px;font-size:12px;color:#999;">Email: <strong style="color:#888;">${email}</strong></p>
          <p style="margin:0 0 4px;font-size:14px;color:#4a4a4a;line-height:1.7;">Can't wait to get started.</p>
          <p style="margin:0;font-size:14px;color:#4a4a4a;font-family:Georgia,'Times New Roman',serif;font-style:italic;">Lisa</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })
}

async function recordPurchase(intent: Stripe.PaymentIntent) {
  let appsyncUrl = ""
  let appsyncApiKey = ""
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const outputs = require("../../../../amplify_outputs.json")
    appsyncUrl = outputs?.data?.url ?? ""
    appsyncApiKey = outputs?.data?.api_key ?? ""
  } catch {
    // amplify_outputs.json not available — skip DB write
    return
  }

  if (!appsyncUrl || !appsyncApiKey) return

  const mutation = `
    mutation CreatePurchase($input: CreatePurchaseInput!) {
      createPurchase(input: $input) { id }
    }
  `

  await fetch(appsyncUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": appsyncApiKey,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          email: intent.metadata?.customerEmail ?? "",
          name: intent.metadata?.customerName ?? "",
          stripePaymentIntentId: intent.id,
          purchasedAt: new Date().toISOString(),
          promoCode: intent.metadata?.promoCode ?? "",
          amountPaidCents: intent.amount,
          discountPct: parseInt(intent.metadata?.discountPct ?? "0", 10),
          includesTracker: intent.metadata?.includesTracker === "true",
          source: "checkout",
        },
      },
    }),
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

  // ── One-time course purchases ─────────────────────────────────────────────
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent
    const email = intent.metadata?.customerEmail
    const product = intent.metadata?.product
    const includesTracker = intent.metadata?.includesTracker === "true"

    if (email) {
      try {
        if (product === "tracker") {
          await grantTrackerAccess(email)
          await sendTrackerConfirmationEmail(email)
        } else if (product === "nutrition") {
          await provisionNutritionUser(email)
        } else if (product === "bundle") {
          await provisionUser(email)
          await provisionNutritionUser(email)
          await recordBundlePurchase(email, intent.id).catch((err) => console.error("recordBundlePurchase failed:", err))
        } else {
          await provisionUser(email)
          if (includesTracker) {
            await grantTrackerAccess(email)
          }
        }
        await recordPurchase(intent).catch((err) =>
          console.error("recordPurchase failed:", err)
        )
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        console.error("Purchase fulfillment failed:", detail)
        return NextResponse.json({ error: "Account setup failed", detail }, { status: 500 })
      }
    }
  }

  // ── First-time subscription activation (primary provisioning path) ──────
  // checkout.session.completed fires immediately after Stripe collects
  // payment. It's the most reliable trigger for one-time coaching activation
  // because it doesn't depend on where Stripe puts the subscription
  // reference on the invoice (which changed between API versions).
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    // Only care about paid subscription checkouts
    if (session.mode !== "subscription" || session.payment_status !== "paid") {
      return NextResponse.json({ received: true })
    }
    const product = session.metadata?.product
    const email = (session.metadata?.customerEmail ?? session.customer_email ?? "").toLowerCase()
    if (!email) return NextResponse.json({ received: true })
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? ""

    try {
      if (product === "coaching") {
        const name = session.metadata?.customerName ?? ""
        const applicationId = session.metadata?.applicationId ?? ""
        const commitmentType = (session.metadata?.coachingCommitmentType ?? "") as "THREE_MONTH_MINIMUM" | "MONTH_TO_MONTH" | ""
        await provisionCoachingSubscriber(email, name, subscriptionId, commitmentType || undefined)
        if (applicationId) {
          await updateCoachingApplication(applicationId, {
            status: "PAID",
            stripeSubscriptionId: subscriptionId,
          }).catch((err) => console.error("updateCoachingApplication failed:", err))
        }
      } else if (product === "masterclass") {
        const plan = session.metadata?.plan ?? "monthly"
        if (subscriptionId) {
          const stripe = makeStripe()
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const periodEnd = extractCurrentPeriodEnd(subscription)
          if (periodEnd) {
            await provisionMasterclassUser(email, subscriptionId, plan, periodEnd)
          }
        }
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.error("checkout.session.completed failed:", detail)
      // Fail-loud: paying customers must not silently fall through the cracks.
      // We return 500 so Stripe retries the webhook, but also notify Lisa
      // immediately so she can intervene manually if retries don't recover it.
      notifyAdmin({
        kind: "webhook-failure",
        subject: `Webhook provisioning FAILED for ${email}`,
        headline: `${product ?? "unknown product"} payment succeeded but provisioning threw`,
        body: `Stripe checkout.session.completed fired for ${email} (session ${session.id}) but provisioning threw an error:\n\n${detail}\n\nStripe will retry the webhook, but if it keeps failing, this customer paid without getting access. Investigate ASAP.`,
        ctaLabel: "Open Stripe dashboard",
        ctaHref: `https://dashboard.stripe.com/events/${event.id}`,
        meta: { email, sessionId: session.id, eventId: event.id, error: detail },
      }).catch(() => {})
      return NextResponse.json({ error: "Provisioning failed", detail }, { status: 500 })
    }
  }

  // ── Subscription invoice events (masterclass + coaching) ─────────────────
  // Still handles renewals AND acts as a fallback if
  // checkout.session.completed didn't fire for the first payment.
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as unknown as {
      subscription?: string
      billing_reason?: string
      parent?: { subscription_details?: { subscription?: string | { id?: string } } }
      lines?: { data?: Array<{ subscription?: string | { id?: string } }> }
    }
    // The subscription reference lives in different places depending on
    // Stripe API version. Try them all.
    const subscriptionId =
      (typeof invoice.subscription === "string" ? invoice.subscription : "") ||
      (typeof invoice.parent?.subscription_details?.subscription === "string"
        ? invoice.parent.subscription_details.subscription
        : invoice.parent?.subscription_details?.subscription?.id ?? "") ||
      (invoice.lines?.data?.map((l) =>
        typeof l.subscription === "string" ? l.subscription : l.subscription?.id
      ).find(Boolean) ?? "")

    if (!subscriptionId) return NextResponse.json({ received: true })

    const subscription = await makeStripe().subscriptions.retrieve(subscriptionId)
    const product = subscription.metadata?.product
    const email = (subscription.metadata?.customerEmail ?? "").toLowerCase()
    const currentPeriodEnd = extractCurrentPeriodEnd(subscription)

    if (!email) return NextResponse.json({ received: true })

    try {
      if (product === "masterclass") {
        const plan = subscription.metadata?.plan ?? "monthly"
        if (invoice.billing_reason === "subscription_create") {
          if (currentPeriodEnd) await provisionMasterclassUser(email, subscriptionId, plan, currentPeriodEnd)
        } else {
          if (currentPeriodEnd) await renewMasterclassAccess(email, new Date(currentPeriodEnd * 1000).toISOString())
        }
      } else if (product === "coaching") {
        const name = subscription.metadata?.customerName ?? ""
        const applicationId = subscription.metadata?.applicationId ?? ""
        if (invoice.billing_reason === "subscription_create") {
          // Idempotent — safe even if checkout.session.completed already ran
          await provisionCoachingSubscriber(email, name, subscriptionId)
          if (applicationId) {
            await updateCoachingApplication(applicationId, {
              status: "PAID",
              stripeSubscriptionId: subscriptionId,
            }).catch((err) => console.error("updateCoachingApplication failed:", err))
          }
        }
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.error("invoice.paid failed:", detail)
      return NextResponse.json({ error: "Subscription provisioning failed", detail }, { status: 500 })
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    const product = subscription.metadata?.product
    const email = (subscription.metadata?.customerEmail ?? "").toLowerCase()
    if (product === "masterclass" && email) {
      await revokeMasterclassAccess(email).catch((err) =>
        console.error("revokeMasterclassAccess failed:", err)
      )
    }
    // coaching subscriptions handled in the coaching block below
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as unknown as { subscription?: string }
    const subscriptionId = invoice.subscription
    if (!subscriptionId) return NextResponse.json({ received: true })
    const stripe = makeStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const product = subscription.metadata?.product
    const email = (subscription.metadata?.customerEmail ?? "").toLowerCase()
    if (!email) return NextResponse.json({ received: true })

    if (product === "masterclass") {
      const resend = new Resend(process.env.RESEND_API_KEY ?? "")
      await resend.emails.send({
        from: "Lisa Fit Method <noreply@lisafitmethod.com>",
        replyTo: "contact@lisafitmethod.com",
        to: email,
        subject: "Action needed: Masterclass payment issue",
        html: masterclassDunningEmail(email),
      }).catch((err) => console.error("Dunning email failed:", err))
    }

    if (product === "coaching") {
      const resend = new Resend(process.env.RESEND_API_KEY ?? "")
      await resend.emails.send({
        from: "Lisa Fit Method <noreply@lisafitmethod.com>",
        replyTo: "contact@lisafitmethod.com",
        to: email,
        subject: "Action needed: Coaching payment issue",
        html: coachingPaymentFailedEmail(email),
      }).catch((err) => console.error("Coaching dunning email failed:", err))
      notifyAdmin({
        kind: "payment-failed",
        subject: `Coaching payment failed — ${email}`,
        headline: "A coaching payment could not be processed",
        body: `The recurring coaching payment for ${email} failed.\n\nA payment-update email has been sent to the client. Stripe will retry automatically. If not resolved after retries, coaching access will be suspended.\n\nCheck Stripe for the failure reason and follow up if the client does not respond.`,
        ctaLabel: "Open Stripe dashboard",
        ctaHref: "https://dashboard.stripe.com/subscriptions",
        meta: { email, subscriptionId: subscriptionId ?? "" },
      }).catch(() => {})
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    if (subscription.metadata?.product !== "coaching") return NextResponse.json({ received: true })
    const email = (subscription.metadata?.customerEmail ?? "").toLowerCase()
    if (email) {
      // Revoke coaching portal access (sets coaching_access_.active = false)
      await revokeCoachingAccess(email).catch((err) =>
        console.error("revokeCoachingAccess failed:", err)
      )
      // Mark coaching client record as INACTIVE and record the effective date
      await updateCoachingClientRecord(email, {
        status: "INACTIVE",
        cancellationEffectiveDate: new Date().toISOString(),
      }).catch((err) => console.error("updateCoachingClientRecord INACTIVE failed:", err))

      // Notify admin — coaching ended
      const clientRecord = await getCoachingClientRecord(email).catch(() => null)
      notifyAdmin({
        kind: "cancellation",
        subject: `Coaching ended — ${clientRecord?.displayName ?? email}`,
        headline: `${clientRecord?.displayName ?? email}'s coaching subscription has ended`,
        body: [
          `Email: ${email}`,
          clientRecord?.approvedPriceInCents
            ? `Monthly price: $${(clientRecord.approvedPriceInCents / 100).toFixed(clientRecord.approvedPriceInCents % 100 === 0 ? 0 : 2)}/month`
            : "",
          `Effective: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
          `Stripe subscription: ${subscription.id}`,
          "Coaching access has been revoked. Cognito account and all purchased products preserved.",
        ].filter(Boolean).join("\n"),
        ctaLabel: "View client profile",
        ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}`,
        meta: { email, stripeSubscriptionId: subscription.id },
      }).catch(() => {})
    }
  }

  return NextResponse.json({ received: true })
}
