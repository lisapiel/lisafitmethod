import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { Resend } from "resend"
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  GetUserCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider"
import {
  ADMIN_EMAIL,
  grantCoachingAccess,
  hasCoachingAccess,
  createCoachingClientRecord,
  getCoachingClientRecord,
  updateCoachingClientRecord,
  listCoachingApplications,
  updateCoachingApplication,
  generateAuthToken,
  storeAuthToken,
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
    return callerEmail === ADMIN_EMAIL
  } catch {
    return false
  }
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  const symbols = "!@#$%&*"
  let pwd = ""
  for (let i = 0; i < 14; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  pwd += symbols[Math.floor(Math.random() * symbols.length)]
  return pwd
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { email: rawEmail } = await req.json()
  if (!rawEmail) return NextResponse.json({ error: "email required" }, { status: 400 })

  const email = rawEmail.toLowerCase().trim()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")

  // 1. Find customer in Stripe by email
  const customers = await stripe.customers.list({ email, limit: 10 })
  if (customers.data.length === 0) {
    return NextResponse.json({ error: `No Stripe customer found for ${email}` }, { status: 404 })
  }

  // 2. Find an active coaching subscription across all matching customers
  let activeSub: Stripe.Subscription | null = null
  let customerName = ""
  for (const customer of customers.data) {
    if (!customerName && customer.name) customerName = customer.name
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 10,
    })
    const coachingSub = subs.data.find((s) => s.metadata?.product === "coaching")
    if (coachingSub) {
      activeSub = coachingSub
      if (coachingSub.metadata?.customerName && !customerName) {
        customerName = coachingSub.metadata.customerName
      }
      break
    }
  }

  if (!activeSub) {
    return NextResponse.json({
      error: `No active coaching subscription found in Stripe for ${email}`,
    }, { status: 404 })
  }

  // 3. Provision: grant access + upsert client record (always force ACTIVE)
  const hadAccess = await hasCoachingAccess(email)
  await grantCoachingAccess(email, "monthly")

  const existingClient = await getCoachingClientRecord(email)
  const displayName = existingClient?.displayName || customerName || email.split("@")[0]
  let clientAction: "created" | "updated_to_active" | "already_active"
  if (!existingClient) {
    await createCoachingClientRecord({ email, displayName, status: "ACTIVE" })
    clientAction = "created"
  } else if (existingClient.status !== "ACTIVE") {
    await updateCoachingClientRecord(email, { status: "ACTIVE" })
    clientAction = "updated_to_active"
  } else {
    clientAction = "already_active"
  }

  // 4. Update any matching application
  try {
    const applications = await listCoachingApplications()
    const matching = applications.find((a) => a.email.toLowerCase() === email && a.status !== "PAID")
    if (matching) {
      await updateCoachingApplication(matching.id, {
        status: "PAID",
        stripeSubscriptionId: activeSub.id,
      })
    }
  } catch (err) {
    console.error("Failed to update application:", err)
  }

  // 5. Send confirmation email (only to non-admin so we don't email Lisa about her own test)
  if (email !== ADMIN_EMAIL) {
    const cognito = makeCognito()
    const resend = new Resend(process.env.RESEND_API_KEY ?? "")
    const firstName = displayName.split(" ")[0] || "there"

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

    try {
      if (userExists) {
        await resend.emails.send({
          from: "Lisa Fit Method <noreply@lisafitmethod.com>",
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
        <p style="margin:0 0 28px;font-size:15px;color:#4a4a4a;line-height:1.7;">Payment confirmed — your coaching portal is now active. Log in with your existing account to get started. I'm already working on your program.</p>
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
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td align="center" style="padding-bottom:32px;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;">Lisa <span style="color:#c8a97e;">Fit Method</span></span>
      </td></tr>
      <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;border-left:4px solid #c8a97e;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">1:1 Coaching</p>
        <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">Welcome, ${firstName}. Let's get started.</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">Payment confirmed — I'm so excited to work with you. Set your password to access your coaching portal.</p>
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
      console.error("Email send failed:", err)
    }
  }

  return NextResponse.json({
    ok: true,
    email,
    subscriptionId: activeSub.id,
    displayName,
    clientAction,
    accessAction: hadAccess ? "already_had_access" : "granted",
    message: `Provisioned ${email}: client record ${clientAction}, access ${hadAccess ? "already existed" : "granted"}, sub ${activeSub.id}`,
  })
}
