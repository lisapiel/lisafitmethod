import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import Stripe from "stripe"
import { Resend } from "resend"
import { revokeCoachingAccess, isAdminEmail, getCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"
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

// POST /api/admin/coaching/revoke-access
// Immediately revokes coaching portal access AND schedules the Stripe subscription
// to cancel at end of current period (so the client is not billed again).
// Does NOT delete the client record, Cognito account, or other purchased products.
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { email?: string }
  const email = body.email?.trim().toLowerCase() ?? ""
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  // Revoke coaching portal access immediately
  await revokeCoachingAccess(email)

  // Get client record for Stripe subscription ID and notification context
  const client = await getCoachingClientRecord(email).catch(() => null)

  // Cancel Stripe subscription at end of current period (or immediately if already cancelled)
  let effectiveDate: string | null = null
  let stripeSubId = client?.stripeSubscriptionId ?? null

  const stripe = makeStripe()

  // If no stored subscription ID, look it up by customer email
  if (!stripeSubId) {
    try {
      const customers = await stripe.customers.list({ email, limit: 5 })
      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 5 })
        for (const sub of subs.data) {
          if (sub.metadata?.product === "coaching") {
            stripeSubId = sub.id
            break
          }
        }
        if (stripeSubId) break
      }
    } catch (err) {
      console.error("revoke-access: Stripe customer lookup failed", err)
    }
  }

  if (stripeSubId) {
    try {
      const sub = await stripe.subscriptions.retrieve(stripeSubId)
      if (sub.status === "active" || sub.status === "trialing") {
        await stripe.subscriptions.update(stripeSubId, { cancel_at_period_end: true })
        const rawEnd = sub.items?.data?.[0]?.current_period_end ?? 0
        effectiveDate = rawEnd ? new Date(rawEnd * 1000).toISOString() : null
      } else {
        // Already cancelled or past_due — no further action needed
        effectiveDate = null
      }
    } catch (err) {
      console.error("revoke-access: Stripe cancellation failed", err)
    }
  }

  // Update coaching client record
  const now = new Date().toISOString()
  await updateCoachingClientRecord(email, {
    status: "INACTIVE",
    cancellationScheduledAt: now,
    ...(effectiveDate ? { cancellationEffectiveDate: effectiveDate } : {}),
    ...(stripeSubId && !client?.stripeSubscriptionId ? { stripeSubscriptionId: stripeSubId } : {}),
  }).catch((err) => console.error("revoke-access: updateCoachingClientRecord failed", err))

  // Notify admin
  notifyAdmin({
    kind: "cancellation",
    subject: `Coaching access revoked — ${client?.displayName ?? email}`,
    headline: `Admin revoked coaching access for ${client?.displayName ?? email}`,
    body: [
      `Email: ${email}`,
      client?.approvedPriceInCents
        ? `Monthly price: $${(client.approvedPriceInCents / 100).toFixed(client.approvedPriceInCents % 100 === 0 ? 0 : 2)}/month`
        : "",
      stripeSubId ? `Stripe subscription ${stripeSubId} scheduled to cancel at end of current period.` : "No Stripe subscription found — check Stripe dashboard manually.",
      effectiveDate ? `Effective cancellation: ${new Date(effectiveDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "",
      "Cognito account and all other purchased products have been preserved.",
    ].filter(Boolean).join("\n"),
    ctaLabel: "View client profile",
    ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}`,
    meta: { email },
  }).catch(() => {})

  // Client notification email
  if (client?.displayName) {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "")
    const firstName = client.displayName.split(" ")[0]
    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      replyTo: "contact@lisafitmethod.com",
      to: email,
      subject: "Your coaching access — Lisa Fit Method",
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
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1a1a1a;line-height:1.3;">A note about your coaching, ${firstName}.</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Your coaching access has been updated. ${effectiveDate ? `Your subscription will not renew after ${new Date(effectiveDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.` : ""}
          </p>
          <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.7;">
            Your Lisa Fit Method account, login, and any courses or products you have purchased separately remain fully available. If you have any questions, please reply to this email.
          </p>
          <p style="margin:0;font-size:15px;color:#1a1a1a;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c8a97e;">Lisa</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    }).catch((err) => console.error("revoke-access: client email failed", err))
  }

  return NextResponse.json({ ok: true, effectiveDate })
}
