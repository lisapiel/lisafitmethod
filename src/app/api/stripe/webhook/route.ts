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
import {
  generateAuthToken, storeAuthToken,
  grantTrainingAccess, grantTrackerAccess, grantNutritionAccess,
  grantMasterclassAccess, renewMasterclassAccess, revokeMasterclassAccess,
  grantCoachingAccess, revokeCoachingAccess, updateCoachingApplication, createCoachingClientRecord,
} from "@/lib/authTokens"

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
      to: email,
      subject: "Nutrition Foundations: your course is ready",
      html: nutritionAccessGrantedEmail(),
    })
    return
  }

  const token = generateAuthToken()
  await storeAuthToken(token, email, "setup")
  const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${token}`

  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    to: email,
    subject: "Your Nutrition Foundations course is ready!",
    html: nutritionWelcomeEmail(email, setPasswordUrl),
  })
}

async function sendTrackerConfirmationEmail(email: string) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
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
  const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${token}`

  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
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
  const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${token}`

  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
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

async function provisionCoachingSubscriber(email: string, name: string) {
  const cognito = makeCognito()
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  const firstName = name.split(" ")[0] || "there"

  await grantCoachingAccess(email, "monthly")
  await createCoachingClientRecord({ email, displayName: name, status: "ACTIVE" })

  let userExists = false
  try {
    await cognito.send(new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
      Username: email,
    }))
    userExists = true
  } catch {
    userExists = false
  }

  if (userExists) {
    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      to: email,
      subject: "Your coaching portal is ready — Lisa Fit Method",
      html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;">Lisa <span style="color:#c8a97e;">Fit Method</span></span>
        </td></tr>
        <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;border-left:4px solid #c8a97e;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">1:1 Coaching</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">You're in, ${firstName}.</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#4a4a4a;line-height:1.7;">Payment confirmed — your coaching portal is now active. Log in with your existing account to get started. I'm already working on your program.</p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#c8a97e;border-radius:2px;">
            <a href="https://lisafitmethod.com/my-coaching" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Open Coaching Portal →</a>
          </td></tr></table>
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
  const setPasswordUrl = `https://lisafitmethod.com/set-password?token=${token}`

  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    to: email,
    subject: "Welcome to 1:1 Coaching — set up your account",
    html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /></head>
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
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">1:1 Coaching</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">Welcome, ${firstName}. Let's get started.</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">Payment confirmed — I'm so excited to work with you. Set your password to access your coaching portal where you'll find your workouts, check-in forms, and direct messaging with me.</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="background:#c8a97e;border-radius:2px;">
            <a href="${setPasswordUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Set Your Password →</a>
          </td></tr></table>
          <p style="margin:0;font-size:12px;color:#999;">This link expires in 48 hours. Email: <strong style="color:#888;">${email}</strong></p>
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

  // ── Masterclass subscription events ──────────────────────────────────────
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as unknown as { subscription?: string; billing_reason?: string }
    const subscriptionId = invoice.subscription
    if (!subscriptionId) return NextResponse.json({ received: true })

    const stripe = makeStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription & { current_period_end: number }
    if (subscription.metadata?.product !== "masterclass") return NextResponse.json({ received: true })

    const email = (subscription.metadata?.customerEmail ?? "").toLowerCase()
    const plan = subscription.metadata?.plan ?? "monthly"
    const currentPeriodEnd = subscription.current_period_end

    if (!email) return NextResponse.json({ received: true })

    try {
      if (invoice.billing_reason === "subscription_create") {
        // First payment — provision user and grant access
        await provisionMasterclassUser(email, subscriptionId, plan, currentPeriodEnd)
      } else {
        // Renewal payment — just extend access period
        await renewMasterclassAccess(email, new Date(currentPeriodEnd * 1000).toISOString())
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.error("Masterclass invoice.paid failed:", detail)
      return NextResponse.json({ error: "Masterclass provisioning failed", detail }, { status: 500 })
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
        to: email,
        subject: "Action needed: Masterclass payment issue",
        html: masterclassDunningEmail(email),
      }).catch((err) => console.error("Dunning email failed:", err))
    }

    if (product === "coaching") {
      const resend = new Resend(process.env.RESEND_API_KEY ?? "")
      await resend.emails.send({
        from: "Lisa Fit Method <noreply@lisafitmethod.com>",
        to: email,
        subject: "Action needed: Coaching payment issue",
        html: coachingPaymentFailedEmail(email),
      }).catch((err) => console.error("Coaching dunning email failed:", err))
    }
  }

  // ── Coaching subscription events ──────────────────────────────────────────
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as unknown as { subscription?: string; billing_reason?: string }
    const subscriptionId = invoice.subscription
    if (!subscriptionId) return NextResponse.json({ received: true })
    const stripe = makeStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription & { current_period_end: number }
    if (subscription.metadata?.product !== "coaching") return NextResponse.json({ received: true })

    const email = (subscription.metadata?.customerEmail ?? "").toLowerCase()
    const name = subscription.metadata?.customerName ?? ""
    const applicationId = subscription.metadata?.applicationId ?? ""
    if (!email) return NextResponse.json({ received: true })

    if (invoice.billing_reason === "subscription_create") {
      await provisionCoachingSubscriber(email, name)
      if (applicationId) {
        await updateCoachingApplication(applicationId, {
          status: "PAID",
          stripeSubscriptionId: subscriptionId,
        }).catch((err) => console.error("updateCoachingApplication failed:", err))
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    if (subscription.metadata?.product !== "coaching") return NextResponse.json({ received: true })
    const email = (subscription.metadata?.customerEmail ?? "").toLowerCase()
    if (email) {
      await revokeCoachingAccess(email).catch((err) =>
        console.error("revokeCoachingAccess failed:", err)
      )
    }
  }

  return NextResponse.json({ received: true })
}
