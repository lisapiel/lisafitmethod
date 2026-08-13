import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import Stripe from "stripe"
import { Resend } from "resend"
import { getCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"
import { notifyAdmin } from "@/lib/notifyAdmin"

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

async function getCallerEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    return result.UserAttributes?.find((a) => a.Name === "email")?.Value ?? null
  } catch {
    return null
  }
}

function computeCommitmentEndDate(subscriptionStartDate: string, commitmentMonths: number): string {
  const d = new Date(subscriptionStartDate)
  d.setMonth(d.getMonth() + commitmentMonths)
  return d.toISOString()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function formatPrice(cents: number) {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

// POST /api/coaching/cancel
// Schedules coaching cancellation / non-renewal via Stripe.
// For THREE_MONTH_MINIMUM clients still in commitment: uses cancel_at = commitment end date.
// For all others: uses cancel_at_period_end = true.
export async function POST(req: NextRequest) {
  const email = await getCallerEmail(req)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    reason?: string
    feedback?: string
  }

  const client = await getCoachingClientRecord(email)
  if (!client) return NextResponse.json({ error: "Coaching record not found" }, { status: 404 })
  if (client.status !== "ACTIVE") return NextResponse.json({ error: "No active coaching subscription" }, { status: 400 })
  if (!client.stripeSubscriptionId) return NextResponse.json({ error: "No Stripe subscription on record" }, { status: 400 })

  // Block self-service cancellation if commitment metadata is unconfirmed
  if (client.commitmentNeedsConfirmation) {
    return NextResponse.json({
      error: "Commitment terms have not been confirmed for your account. Please contact contact@lisafitmethod.com.",
    }, { status: 400 })
  }

  const stripe = makeStripe()
  const sub = await stripe.subscriptions.retrieve(client.stripeSubscriptionId)

  // Determine whether commitment is still active
  let inCommitment = false
  let commitmentEndDate: string | null = null

  if (client.commitmentType === "THREE_MONTH_MINIMUM" &&
      client.subscriptionStartDate &&
      client.commitmentMonths &&
      client.commitmentMonths > 0) {
    commitmentEndDate = computeCommitmentEndDate(client.subscriptionStartDate, client.commitmentMonths)
    inCommitment = new Date() < new Date(commitmentEndDate)
  }

  const rawPeriodEnd = sub.items?.data?.[0]?.current_period_end ?? 0
  const currentPeriodEnd = new Date(rawPeriodEnd * 1000).toISOString()
  let effectiveDate: string

  if (inCommitment && commitmentEndDate) {
    // Schedule cancellation at the commitment end (not at next period end)
    const cancelAt = Math.floor(new Date(commitmentEndDate).getTime() / 1000)
    await stripe.subscriptions.update(client.stripeSubscriptionId, {
      cancel_at: cancelAt,
      cancel_at_period_end: false,
    })
    effectiveDate = commitmentEndDate
  } else {
    // Cancel at end of current period (already-paid period remains active)
    await stripe.subscriptions.update(client.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })
    effectiveDate = currentPeriodEnd
  }

  const now = new Date().toISOString()
  await updateCoachingClientRecord(email, {
    cancellationScheduledAt: now,
    cancellationEffectiveDate: effectiveDate,
    cancellationReason: body.reason ?? undefined,
    cancellationFeedback: body.feedback ?? undefined,
  })

  // Admin notification
  const priceLine = client.approvedPriceInCents ? formatPrice(client.approvedPriceInCents) + "/month" : "custom price"
  const commitmentLine = client.commitmentType === "THREE_MONTH_MINIMUM"
    ? "3-month minimum"
    : client.commitmentType === "MONTH_TO_MONTH"
      ? "Month-to-month"
      : "Unknown (needs confirmation)"

  notifyAdmin({
    kind: "cancellation",
    subject: `Coaching cancellation scheduled — ${client.displayName}`,
    headline: `${client.displayName} has scheduled cancellation of their coaching subscription`,
    body: [
      `Name: ${client.displayName}`,
      `Email: ${email}`,
      `Monthly price: ${priceLine}`,
      `Commitment type: ${commitmentLine}`,
      `Subscription start: ${client.subscriptionStartDate ? formatDate(client.subscriptionStartDate) : "Unknown"}`,
      `Commitment end: ${commitmentEndDate ? formatDate(commitmentEndDate) : "N/A"}`,
      `Next billing date: ${formatDate(currentPeriodEnd)}`,
      `Inside commitment window: ${inCommitment ? "Yes — remaining payments will still process" : "No"}`,
      `Cancellation requested: ${formatDate(now)}`,
      `Coaching active through: ${formatDate(effectiveDate)}`,
      body.reason ? `Reason: ${body.reason}` : "",
      body.feedback ? `Feedback: ${body.feedback}` : "",
    ].filter(Boolean).join("\n"),
    ctaLabel: "View client profile",
    ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}`,
    meta: { email },
  }).catch(() => {})

  // Client confirmation email
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  const firstName = client.displayName.split(" ")[0]

  let emailSubject: string
  let emailBody: string

  if (inCommitment && commitmentEndDate) {
    emailSubject = "Your coaching cancellation is scheduled — Lisa Fit Method"
    emailBody = `<!DOCTYPE html>
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
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1a1a1a;line-height:1.3;">Cancellation scheduled, ${firstName}.</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Your coaching non-renewal has been scheduled. Your remaining payments under your initial 3-month commitment will still process as scheduled — this cannot be waived.
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Your coaching access remains fully active through <strong>${formatDate(effectiveDate)}</strong>, and your subscription will not renew after your commitment ends.
          </p>
          <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.7;">
            If you have questions, want to pause, or change your mind, reply to this email or reach us at contact@lisafitmethod.com.
          </p>
          <p style="margin:0;font-size:15px;color:#1a1a1a;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c8a97e;">Lisa</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
  } else {
    emailSubject = "Your coaching cancellation is scheduled — Lisa Fit Method"
    emailBody = `<!DOCTYPE html>
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
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1a1a1a;line-height:1.3;">Cancellation scheduled, ${firstName}.</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Your coaching subscription has been scheduled to end. Your access remains fully active through <strong>${formatDate(effectiveDate)}</strong> — that period is already paid for.
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            After that date, your subscription will not renew and no further charges will be made.
          </p>
          <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.7;">
            If you have questions or change your mind before ${formatDate(effectiveDate)}, reply to this email or reach us at contact@lisafitmethod.com.
          </p>
          <p style="margin:0;font-size:15px;color:#1a1a1a;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c8a97e;">Lisa</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
  }

  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: emailSubject,
    html: emailBody,
  }).catch((err) => console.error("Cancellation confirmation email failed:", err))

  return NextResponse.json({ ok: true, effectiveDate, inCommitment })
}
