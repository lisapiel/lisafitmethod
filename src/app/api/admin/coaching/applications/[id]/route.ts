import { NextRequest, NextResponse } from "next/server"
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider"
import Stripe from "stripe"
import { Resend } from "resend"
import {
  ADMIN_EMAIL,
  getCoachingApplication,
  updateCoachingApplication,
  createCoachingClientRecord,
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

function approvalEmail(name: string, checkoutUrl: string): string {
  const firstName = name.split(" ")[0]
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
        <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;border-left:4px solid #c8a97e;">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="width:56px;vertical-align:middle;">
                <img src="https://lisafitmethod.com/lisa-email.jpg" alt="Lisa" width="48" height="48" style="width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;" />
              </td>
              <td style="padding-left:14px;vertical-align:middle;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">Lisa McPherson</p>
                <p style="margin:2px 0 0;font-size:12px;color:#888;">Certified Personal Trainer</p>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">1:1 Coaching</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">
            You're in, ${firstName}.
          </h1>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            I've reviewed your application and I'm excited to work with you. Click below to set up your monthly membership and get access to your coaching portal.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Once payment is confirmed, you'll receive an email with your login details and I'll start building your personalised program.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#c8a97e;border-radius:2px;">
                <a href="${checkoutUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                  Set Up My Coaching →
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0;font-size:12px;color:#999;">
            This link is unique to you. Any questions, reply to this email or DM me on Instagram
            <a href="https://instagram.com/lisafitmethod" style="color:#c8a97e;">@lisafitmethod</a>.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:11px;color:#aaa;">Lisa Fit Method · lisafitmethod.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function declineEmail(name: string): string {
  const firstName = name.split(" ")[0]
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
        <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">1:1 Coaching</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1a1a1a;line-height:1.3;">
            Thank you for applying, ${firstName}
          </h1>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Thank you so much for your interest in 1:1 coaching. Unfortunately I'm at capacity right now and I'm not able to take on new clients at this time.
          </p>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            I'll keep your application on file and reach out if a spot opens up. In the meantime, my courses and Masterclass membership are available at
            <a href="https://lisafitmethod.com" style="color:#c8a97e;">lisafitmethod.com</a>.
          </p>
          <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.7;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c8a97e;">Lisa</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json() as { action: "approve" | "decline"; priceInCents?: number }

  const application = await getCoachingApplication(id)
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY ?? "")

  if (body.action === "decline") {
    await updateCoachingApplication(id, {
      status: "DECLINED",
      reviewedAt: new Date().toISOString(),
    })
    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      to: application.email,
      subject: "Your coaching application — Lisa Fit Method",
      html: declineEmail(application.name),
    }).catch((err) => console.error("Decline email failed:", err))
    return NextResponse.json({ ok: true, status: "DECLINED" })
  }

  if (body.action === "approve") {
    const priceInCents = body.priceInCents
    if (!priceInCents || priceInCents < 100) {
      return NextResponse.json({ error: "Monthly price is required (minimum $1.00)" }, { status: 400 })
    }

    // Ensure applicant has a Cognito account (so Stripe can match them later)
    const cognito = makeCognito()
    try {
      await cognito.send(new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Username: application.email,
      }))
    } catch {
      // Create the account now — they'll set their password after payment
      try {
        await cognito.send(new AdminCreateUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
          Username: application.email,
          UserAttributes: [
            { Name: "email", Value: application.email },
            { Name: "email_verified", Value: "true" },
          ],
          TemporaryPassword: `Lfm${Math.random().toString(36).slice(2, 8)}!`,
          MessageAction: "SUPPRESS",
        }))
      } catch (err) {
        if (!(err instanceof UsernameExistsException)) {
          console.error("Cognito account creation failed:", err)
        }
      }
    }

    const stripe = makeStripe()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lisafitmethod.com"

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: application.email,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "1:1 Coaching — Lisa Fit Method" },
          unit_amount: priceInCents,
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      metadata: {
        product: "coaching",
        customerEmail: application.email,
        customerName: application.name,
        applicationId: id,
      },
      subscription_data: {
        metadata: {
          product: "coaching",
          customerEmail: application.email,
          customerName: application.name,
          applicationId: id,
        },
      },
      success_url: `${baseUrl}/coaching/welcome`,
      cancel_url: `${baseUrl}/coaching`,
    })

    const checkoutUrl = session.url ?? ""

    // Create client record now so admin can see and prep program before payment completes
    await createCoachingClientRecord({
      email: application.email,
      displayName: application.name,
      status: "PENDING_PAYMENT",
      goal: application.goals || undefined,
    }).catch((err) => console.error("createCoachingClientRecord failed:", err))

    await updateCoachingApplication(id, {
      status: "APPROVED",
      reviewedAt: new Date().toISOString(),
      stripeCheckoutUrl: checkoutUrl,
    })

    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      to: application.email,
      subject: "You're approved — set up your coaching membership",
      html: approvalEmail(application.name, checkoutUrl),
    }).catch((err) => console.error("Approval email failed:", err))

    return NextResponse.json({ ok: true, status: "APPROVED", checkoutUrl })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
