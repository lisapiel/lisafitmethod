import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import Stripe from "stripe"
import { Resend } from "resend"
import {
  isAdminEmail,
  updateCoachingClientRecord,
  type CommitmentType,
} from "@/lib/authTokens"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

function makeDb() {
  return DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  }))
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

function makeStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
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

function approvalEmail(name: string, acceptUrl: string): string {
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
            Welcome back, ${firstName}.
          </h1>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            I'd love to work with you again. Click below to review your coaching terms and set up your monthly membership.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Once payment is confirmed, you'll be back in your coaching portal right away — no new account needed.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#c8a97e;border-radius:2px;">
                <a href="${acceptUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                  Restart My Coaching →
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

// POST /api/admin/coaching/restart-requests/approve
// Admin approves a former client's restart request with a new price + commitment.
// Creates a new application record (for the /coaching/accept/:id interstitial) and a Stripe checkout session.
// Updates coaching_client_ record with PENDING_PAYMENT + new terms while preserving coaching history.
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as {
    requestId?: string
    priceInCents?: number
    commitmentType?: CommitmentType
  }

  const { requestId, priceInCents, commitmentType } = body

  if (!requestId) return NextResponse.json({ error: "requestId is required" }, { status: 400 })
  if (!priceInCents || priceInCents < 100) {
    return NextResponse.json({ error: "Monthly price is required (minimum $1.00)" }, { status: 400 })
  }
  if (!commitmentType || !["THREE_MONTH_MINIMUM", "MONTH_TO_MONTH"].includes(commitmentType)) {
    return NextResponse.json({ error: "Commitment type is required" }, { status: 400 })
  }

  const db = makeDb()

  // Look up the restart request
  const requestResult = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { userId: `coaching_restart_${requestId}` },
  }))

  if (!requestResult.Item) {
    return NextResponse.json({ error: "Restart request not found" }, { status: 404 })
  }

  const restartRequest = requestResult.Item
  const email = String(restartRequest.email)
  const displayName = String(restartRequest.displayName)

  // Create a new application record — this powers the /coaching/accept/:id interstitial.
  // The accept page reads status APPROVED + stripeCheckoutUrl from this record.
  const applicationId = randomBytes(12).toString("hex")

  const stripe = makeStripe()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lisafitmethod.com"

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
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
      customerEmail: email,
      customerName: displayName,
      applicationId,
      coachingCommitmentType: commitmentType,
      coachingCommitmentMonths: commitmentType === "THREE_MONTH_MINIMUM" ? "3" : "0",
    },
    subscription_data: {
      metadata: {
        product: "coaching",
        customerEmail: email,
        customerName: displayName,
        applicationId,
        coachingCommitmentType: commitmentType,
        coachingCommitmentMonths: commitmentType === "THREE_MONTH_MINIMUM" ? "3" : "0",
      },
    },
    success_url: `${baseUrl}/coaching/welcome`,
    cancel_url: `${baseUrl}/account`,
  })

  const checkoutUrl = session.url ?? ""
  const acceptUrl = `${baseUrl}/coaching/accept/${applicationId}`

  // Store the application record so the accept interstitial can read it.
  // Uses the same coaching_app_ prefix as getCoachingApplication().
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      userId: `coaching_app_${applicationId}`,
      id: applicationId,
      email,
      name: displayName,
      status: "APPROVED",
      applicationDate: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      stripeCheckoutUrl: checkoutUrl,
      approvedPriceInCents: priceInCents,
      approvedCommitmentType: commitmentType,
    },
  }))

  // Update the coaching_client_ record: new terms + PENDING_PAYMENT, preserving coaching history.
  // Do not overwrite cancellationEffectiveDate or other historical fields.
  await updateCoachingClientRecord(email, {
    status: "PENDING_PAYMENT",
    approvedPriceInCents: priceInCents,
    commitmentType,
    commitmentMonths: commitmentType === "THREE_MONTH_MINIMUM" ? 3 : 0,
    commitmentNeedsConfirmation: false,
  })

  // Send accept link to client
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "Welcome back — restart your coaching",
    html: approvalEmail(displayName, acceptUrl),
  }).catch((err) => console.error("Restart approval email failed:", err))

  return NextResponse.json({ ok: true, acceptUrl, checkoutUrl })
}
