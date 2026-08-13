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

// POST /api/coaching/reactivate
// Reverses a scheduled cancellation (removes cancel_at or cancel_at_period_end flag).
// Does not change price, billing cycle, or restart commitment period.
export async function POST(req: NextRequest) {
  const email = await getCallerEmail(req)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Unused body but parsed for consistency
  await req.json().catch(() => ({}))

  const client = await getCoachingClientRecord(email)
  if (!client) return NextResponse.json({ error: "Coaching record not found" }, { status: 404 })
  if (!client.stripeSubscriptionId) return NextResponse.json({ error: "No Stripe subscription on record" }, { status: 400 })
  if (!client.cancellationScheduledAt) return NextResponse.json({ error: "No scheduled cancellation to reverse" }, { status: 400 })

  const stripe = makeStripe()
  const sub = await stripe.subscriptions.retrieve(client.stripeSubscriptionId)

  // Clear both forms of scheduled cancellation
  if (sub.cancel_at || sub.cancel_at_period_end) {
    await stripe.subscriptions.update(client.stripeSubscriptionId, {
      cancel_at_period_end: false,
      cancel_at: null,
    })
  }

  // Clear the cancellation fields from our record
  await updateCoachingClientRecord(email, {
    cancellationScheduledAt: undefined,
    cancellationEffectiveDate: undefined,
    cancellationReason: undefined,
    cancellationFeedback: undefined,
  })

  // Admin notification
  notifyAdmin({
    kind: "cancellation-reversed",
    subject: `Coaching cancellation reversed — ${client.displayName}`,
    headline: `${client.displayName} has reversed their scheduled coaching cancellation`,
    body: `${client.displayName} (${email}) has chosen to keep their coaching subscription. The scheduled cancellation has been removed. Their subscription continues unchanged.`,
    ctaLabel: "View client profile",
    ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}`,
    meta: { email },
  }).catch(() => {})

  // Client confirmation email
  const resend = new Resend(process.env.RESEND_API_KEY ?? "")
  const firstName = client.displayName.split(" ")[0]

  await resend.emails.send({
    from: "Lisa Fit Method <noreply@lisafitmethod.com>",
    replyTo: "contact@lisafitmethod.com",
    to: email,
    subject: "You're staying — coaching subscription continues | Lisa Fit Method",
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
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1a1a1a;line-height:1.3;">You're staying, ${firstName}.</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Your scheduled cancellation has been removed. Your coaching subscription continues exactly as before — same price, same billing date, nothing changes.
          </p>
          <p style="margin:0 0 24px;font-size:13px;color:#888;line-height:1.7;">
            If anything prompted you to consider cancelling, I'd love to hear about it — reply to this email or reach me at contact@lisafitmethod.com.
          </p>
          <p style="margin:0;font-size:15px;color:#1a1a1a;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c8a97e;">Lisa</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  }).catch((err) => console.error("Reactivation confirmation email failed:", err))

  return NextResponse.json({ ok: true })
}
