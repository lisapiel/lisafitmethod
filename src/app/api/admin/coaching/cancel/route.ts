import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import Stripe from "stripe"
import { Resend } from "resend"
import { isAdminEmail, getCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"
import { notifyAdmin } from "@/lib/notifyAdmin"

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

function makeStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
}

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    return callerEmail && isAdminEmail(callerEmail) ? callerEmail : null
  } catch {
    return null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function formatPrice(cents: number) {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

// GET /api/admin/coaching/cancel?email=xxx
// Returns the effective cancellation date (end of current billing period) so the
// admin UI can show it before the admin confirms.
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? ""
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const client = await getCoachingClientRecord(email).catch(() => null)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
  if (client.status !== "ACTIVE") return NextResponse.json({ error: "Client is not ACTIVE" }, { status: 400 })

  const stripe = makeStripe()
  let stripeSubId = client.stripeSubscriptionId ?? null

  if (!stripeSubId) {
    try {
      const customers = await stripe.customers.list({ email, limit: 5 })
      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 5 })
        for (const sub of subs.data) {
          if (sub.metadata?.product === "coaching") { stripeSubId = sub.id; break }
        }
        if (stripeSubId) break
      }
    } catch { /* handled below */ }
  }

  if (!stripeSubId) {
    return NextResponse.json({ error: "No active Stripe subscription found. Check Stripe dashboard." }, { status: 404 })
  }

  const sub = await stripe.subscriptions.retrieve(stripeSubId)
  const rawEnd = sub.items?.data?.[0]?.current_period_end ?? 0
  const effectiveDate = rawEnd ? new Date(rawEnd * 1000).toISOString() : null
  const alreadyScheduled = sub.cancel_at_period_end || !!sub.cancel_at

  return NextResponse.json({
    ok: true,
    stripeSubId,
    effectiveDate,
    effectiveDateDisplay: effectiveDate ? formatDate(effectiveDate) : null,
    alreadyScheduled,
    stripeStatus: sub.status,
  })
}

// POST /api/admin/coaching/cancel
// Graceful admin-initiated cancellation. Coaching access stays active through
// the end of the current billing period; Stripe stops renewing after that.
// Does NOT immediately revoke access — Stripe's subscription.deleted webhook handles that.
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { email?: string; reason?: string }
  const email = body.email?.trim().toLowerCase() ?? ""
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const client = await getCoachingClientRecord(email)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
  if (client.status !== "ACTIVE") return NextResponse.json({ error: "Client is not ACTIVE" }, { status: 400 })

  const stripe = makeStripe()
  let stripeSubId = client.stripeSubscriptionId ?? null

  // Look up Stripe subscription by customer email if not stored
  if (!stripeSubId) {
    try {
      const customers = await stripe.customers.list({ email, limit: 5 })
      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 5 })
        for (const sub of subs.data) {
          if (sub.metadata?.product === "coaching") { stripeSubId = sub.id; break }
        }
        if (stripeSubId) break
      }
    } catch (err) {
      console.error("admin/coaching/cancel: Stripe lookup failed", err)
    }
  }

  if (!stripeSubId) {
    return NextResponse.json({
      error: "No active Stripe subscription found for this client. Go to Stripe dashboard to cancel manually.",
    }, { status: 404 })
  }

  const sub = await stripe.subscriptions.retrieve(stripeSubId)
  if (sub.cancel_at_period_end || sub.cancel_at) {
    return NextResponse.json({ error: "Cancellation is already scheduled in Stripe." }, { status: 400 })
  }

  // Schedule Stripe cancellation at end of current period
  await stripe.subscriptions.update(stripeSubId, { cancel_at_period_end: true })

  const rawEnd = sub.items?.data?.[0]?.current_period_end ?? 0
  const effectiveDate = rawEnd ? new Date(rawEnd * 1000).toISOString() : new Date().toISOString()

  // Record cancellation in DynamoDB (status stays ACTIVE until Stripe fires subscription.deleted)
  const now = new Date().toISOString()
  await updateCoachingClientRecord(email, {
    cancellationScheduledAt: now,
    cancellationEffectiveDate: effectiveDate,
    cancellationReason: body.reason ?? "Admin-initiated cancellation",
    ...(client.stripeSubscriptionId ? {} : { stripeSubscriptionId: stripeSubId }),
  })

  const priceLine = client.approvedPriceInCents ? formatPrice(client.approvedPriceInCents) + "/month" : "custom price"

  // Admin self-notification
  notifyAdmin({
    kind: "cancellation",
    subject: `Coaching cancellation scheduled — ${client.displayName}`,
    headline: `Admin scheduled cancellation for ${client.displayName}`,
    body: [
      `Email: ${email}`,
      `Monthly price: ${priceLine}`,
      `Commitment: Month-to-month`,
      `Coaching active through: ${formatDate(effectiveDate)}`,
      `Stripe will stop renewing after ${formatDate(effectiveDate)}. No further payments will be collected.`,
      body.reason ? `Reason noted: ${body.reason}` : "",
    ].filter(Boolean).join("\n"),
    ctaLabel: "View client profile",
    ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}`,
    meta: { email, stripeSubscriptionId: stripeSubId },
  }).catch(() => {})

  // Client notification
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  const firstName = client.displayName.split(" ")[0]
  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "Your coaching subscription — Lisa Fit Method",
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
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1a1a1a;line-height:1.3;">Coaching scheduled to end, ${firstName}.</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Your coaching subscription has been scheduled to end. You retain full coaching access through <strong>${formatDate(effectiveDate)}</strong> — no further charges will be made after that date.
          </p>
          <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.7;">
            Your Lisa Fit Method account and any courses or products you've purchased separately remain available. If you have any questions or would like to discuss continuing your coaching, please reply to this email.
          </p>
          <p style="margin:0;font-size:15px;color:#1a1a1a;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c8a97e;">Lisa</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  }).catch((err) => console.error("admin cancel: client email failed", err))

  return NextResponse.json({ ok: true, effectiveDate, effectiveDateDisplay: formatDate(effectiveDate) })
}
