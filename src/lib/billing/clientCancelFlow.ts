import { Resend } from "resend"
import { clearCoachingCancellation, getCoachingClientRecord, updateCoachingClientRecord, type CoachingClientRecord } from "@/lib/authTokens"
import { notifyAdmin } from "@/lib/notifyAdmin"
import { sharedDocClient } from "@/lib/dynamoClient"
import { claimCancelNotice, claimPaidCancelNotice, clearPaidCancel, readState as readBillingState, releaseCancelNotice, releasePaidCancelNotice } from "./store"
import { isComplimentaryActive } from "./entitlement"
import { clientCancelComplimentary, clientCancelPaid, clientKeepCoaching } from "./actions"
import { unknownReasonForAdmin, type PlannedPayment, type UnknownReason } from "./cancellation"
import { billingDeps } from "./server"
import { clientDateLabel, complimentaryCancellationEmail, moneyLabel, paidCancellationEmail } from "./clientEmails"

// A client's cancellation, start to finish. Used by the client's own cancel
// request (and its "Check again") and by Lisa's "Finish cancellation request"
// in Admin, so both always follow exactly the same rules:
// 1. The request is recorded first, so it is never lost.
// 2. The end date is worked out from Stripe and the terms the client accepted
//    (cancellation.ts and entitlement.ts). It is never guessed.
// 3. Once Stripe confirms, the client sees the date and gets one confirmation
//    email, and Lisa is notified. If the date can't be confirmed, the request
//    stays pending and Lisa is alerted once.

export type FlowResult = { status: number; body: Record<string, unknown> }
const reply = (body: Record<string, unknown>, init?: { status: number }): FlowResult => ({ status: init?.status ?? 200, body })

type Body = { reason?: string; feedback?: string; timeZone?: string }

export async function runClientCancellation(email: string, input: Body & { requestedBy: string }): Promise<FlowResult> {
  const client = await getCoachingClientRecord(email)
  if (!client) return reply({ error: "Coaching record not found" }, { status: 404 })
  if (client.status !== "ACTIVE") return reply({ error: "No active coaching subscription" }, { status: 400 })

  const now = new Date().toISOString()
  const reason = typeof input.reason === "string" ? input.reason.slice(0, 200) : undefined
  const feedback = typeof input.feedback === "string" ? input.feedback.slice(0, 2000) : undefined
  const timeZone = typeof input.timeZone === "string" && input.timeZone ? input.timeZone.slice(0, 64) : client.cancellationTimeZone
  const requestedAt = client.cancellationRequestedAt ?? now
  await updateCoachingClientRecord(email, {
    cancellationRequestedAt: requestedAt,
    ...(reason ? { cancellationReason: reason } : {}),
    ...(feedback ? { cancellationFeedback: feedback } : {}),
    ...(timeZone ? { cancellationTimeZone: timeZone } : {}),
  })
  const record: CoachingClientRecord = { ...client, cancellationRequestedAt: requestedAt, cancellationReason: reason ?? client.cancellationReason, cancellationFeedback: feedback ?? client.cancellationFeedback }
  const body: Body = { timeZone }

  const billing = await readBillingState(sharedDocClient(), email).catch(() => null)
  if (isComplimentaryActive(billing, new Date())) return cancelComplimentary(email, record, body, now)
  return cancelPaid(email, record, body, now, input.requestedBy)
}

// Dates in Lisa's admin emails are in her time zone.
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" })
}


const PENDING_MESSAGE = "Your cancellation request is recorded. I'm confirming your end date, and you'll get an email as soon as it's confirmed. Your coaching continues in the meantime."
const profileLink = (email: string) => `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(email)}`

async function pending(email: string, client: CoachingClientRecord, detail: string | null, now: string): Promise<FlowResult> {
  // Lisa is alerted once per request when it needs her; a request that is only
  // waiting on Stripe's answer finishes by itself and doesn't alert.
  if (detail && !client.cancellationAlertedAt) {
    await updateCoachingClientRecord(email, { cancellationAlertedAt: now }).catch(() => {})
    notifyAdmin({
      kind: "cancellation",
      subject: `Cancellation request needs you: ${client.displayName}`,
      headline: `${client.displayName} asked to cancel, and the end date couldn't be confirmed`,
      body: [
        `Email: ${email}`,
        `Requested: ${formatDate(client.cancellationRequestedAt ?? now)}`,
        `Why it's pending: ${detail}`,
        client.cancellationReason ? `Reason: ${client.cancellationReason}` : "",
        client.cancellationFeedback ? `Comments: ${client.cancellationFeedback}` : "",
        "",
        "Their coaching continues. Nothing has been changed in Stripe, and the client has been told their request is recorded and being confirmed. Open their billing panel to finish it, before their next renewal: under your Terms, a charge after their request would have to be refunded.",
      ].filter(Boolean).join("\n"),
      ctaLabel: "Open billing panel",
      ctaHref: profileLink(email),
      meta: { email },
    }).catch(() => {})
  }
  return reply({ error: PENDING_MESSAGE, pending: true, requestedAt: client.cancellationRequestedAt ?? now }, { status: 202 })
}

async function sendClientEmail(email: string, mail: { subject: string; html: string; text: string }): Promise<boolean> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "")
    const sent = await resend.emails.send({ from: "Lisa Fit Method <noreply@lisafitmethod.com>", replyTo: "contact@lisafitmethod.com", to: email, subject: mail.subject, html: mail.html, text: mail.text })
    if (sent?.error) throw new Error(sent.error.message ?? "email not sent")
    return true
  } catch (err) {
    console.error("Cancellation confirmation email failed:", err instanceof Error ? err.message : err)
    return false
  }
}

function paymentsForAdmin(payments: PlannedPayment[]): string {
  return payments.length ? payments.map((p) => `${p.amountCents != null ? moneyLabel(p.amountCents) : "amount on invoice"} on ${formatDate(p.date)}`).join(", ") : "None"
}

async function cancelPaid(email: string, client: CoachingClientRecord, body: Body, now: string, requestedBy: string): Promise<FlowResult> {
  const r = await clientCancelPaid(billingDeps(), { email, requestedBy })
  if (!r.ok) {
    if (r.outcome === "busy") return reply({ error: r.message }, { status: 409 })
    if (r.outcome === "not-found") return reply({ error: r.message }, { status: 404 })
    const detail = r.outcome === "pending" ? null : r.adminDetail && r.outcome === "unknown-date" ? unknownReasonForAdmin(r.adminDetail as UnknownReason) : r.adminDetail ?? r.message
    return pending(email, client, detail, now)
  }

  await updateCoachingClientRecord(email, { cancellationScheduledAt: client.cancellationScheduledAt ?? now, cancellationEffectiveDate: r.endsAt })
  const claimed = await claimPaidCancelNotice(sharedDocClient(), email)
  if (claimed) {
    notifyAdmin({
      kind: "cancellation",
      subject: `Coaching cancellation scheduled: ${client.displayName}`,
      headline: `${client.displayName} has cancelled their coaching`,
      body: [
        `Email: ${email}`,
        `Monthly price: ${client.approvedPriceInCents ? `${moneyLabel(client.approvedPriceInCents)}/month` : "custom price"}`,
        `Commitment: ${client.commitmentType === "THREE_MONTH_MINIMUM" ? `3-month minimum${r.commitmentEndsAt ? `, ends ${formatDate(r.commitmentEndsAt)}` : ""}` : client.commitmentType === "MONTH_TO_MONTH" ? "Month-to-month" : "Unknown"}`,
        `Requested: ${formatDate(client.cancellationRequestedAt ?? now)}`,
        `Coaching active through: ${formatDate(r.endsAt)}`,
        `Payments still to come: ${paymentsForAdmin(r.remainingPayments)}`,
        client.cancellationReason ? `Reason: ${client.cancellationReason}` : "",
        client.cancellationFeedback ? `Comments: ${client.cancellationFeedback}` : "",
      ].filter(Boolean).join("\n"),
      ctaLabel: "Open billing panel",
      ctaHref: profileLink(email),
      meta: { email },
    }).catch(() => {})
    const mail = paidCancellationEmail({
      firstName: client.displayName.split(" ")[0] ?? "",
      effectiveDateLabel: clientDateLabel(r.endsAt, body.timeZone),
      remainingPayments: r.remainingPayments.map((p) => ({ dateLabel: clientDateLabel(p.date, body.timeZone), amountCents: p.amountCents })),
    })
    // The cancellation itself is confirmed either way; a failed email is released so "Check again" resends it.
    if (!(await sendClientEmail(email, mail))) await releasePaidCancelNotice(sharedDocClient(), email).catch(() => {})
  }
  return reply({ ok: true, effectiveDate: r.endsAt, remainingPayments: r.remainingPayments, commitmentEndsAt: r.commitmentEndsAt, complimentary: false })
}

// A complimentary client's own cancellation: no commitment, nothing charged.
async function cancelComplimentary(email: string, client: CoachingClientRecord, body: Body, now: string): Promise<FlowResult> {
  const r = await clientCancelComplimentary(billingDeps(), { email })
  if (!r.ok) {
    if (r.status === 404) return reply({ error: r.message }, { status: 404 })
    if (r.status === 409 && !r.uncertain && r.message.startsWith("Your account is being updated")) return reply({ error: r.message }, { status: 409 })
    return pending(email, client, r.uncertain ? null : r.message, now)
  }

  const db = sharedDocClient()
  const confirmed = await claimCancelNotice(db, email, now)
  if (!confirmed) {
    const state = await readBillingState(db, email).catch(() => null)
    if (state?.compCancelNotifiedAt && state.compEndReason === "client-cancelled" && state.compEndsAt) {
      return reply({ ok: true, effectiveDate: state.compEndsAt, remainingPayments: [], complimentary: true })
    }
    return pending(email, client, null, now)
  }
  const effectiveDate = confirmed.compEndsAt!
  await updateCoachingClientRecord(email, { cancellationScheduledAt: client.cancellationScheduledAt ?? now, cancellationEffectiveDate: effectiveDate })

  notifyAdmin({
    kind: "cancellation",
    subject: `Complimentary coaching cancellation: ${client.displayName}`,
    headline: `${client.displayName} has cancelled their complimentary coaching`,
    body: [
      `Email: ${email}`,
      "Billing: complimentary (no commitment applies, nothing is charged)",
      `Requested: ${formatDate(client.cancellationRequestedAt ?? now)}`,
      `Coaching active through: ${formatDate(effectiveDate)}`,
      client.cancellationReason ? `Reason: ${client.cancellationReason}` : "",
      client.cancellationFeedback ? `Comments: ${client.cancellationFeedback}` : "",
    ].filter(Boolean).join("\n"),
    ctaLabel: "Open billing panel",
    ctaHref: profileLink(email),
    meta: { email },
  }).catch(() => {})

  const mail = complimentaryCancellationEmail({ firstName: client.displayName.split(" ")[0] ?? "", effectiveDateLabel: clientDateLabel(effectiveDate, body.timeZone) })
  if (!(await sendClientEmail(email, mail))) await releaseCancelNotice(db, email).catch(() => {})
  return reply({ ok: true, effectiveDate, remainingPayments: [], complimentary: true })
}

// Keep My Coaching: the client withdraws their cancellation (or a request still
// waiting for its end date). Stripe is changed and checked first; only then
// are the records cleared, Lisa notified and the client emailed.
export async function runKeepCoaching(email: string): Promise<FlowResult> {
  const client = await getCoachingClientRecord(email)
  if (!client) return reply({ error: "Coaching record not found" }, { status: 404 })
  // Even with nothing on our record, Stripe may still have an end set (for
  // example by the old flow); the action removes it if so.
  const r = await clientKeepCoaching(billingDeps(), { email })
  if (!r.ok) return reply({ error: r.message, pending: r.uncertain === true }, { status: r.status })
  if (!r.changedStripe && !client.cancellationScheduledAt && !client.cancellationRequestedAt) return reply({ error: "No scheduled cancellation to reverse" }, { status: 400 })

  await clearCoachingCancellation(email)
  await clearPaidCancel(sharedDocClient(), email)

  notifyAdmin({
    kind: "cancellation-reversed",
    subject: `Coaching cancellation reversed: ${client.displayName}`,
    headline: `${client.displayName} has decided to keep their coaching`,
    body: `${client.displayName} (${email}) chose Keep my coaching. ${r.changedStripe ? "The scheduled end has been removed in Stripe" : "Their cancellation request was withdrawn before anything changed in Stripe"}; their subscription continues unchanged.`,
    ctaLabel: "Open billing panel",
    ctaHref: profileLink(email),
    meta: { email },
  }).catch(() => {})

  const firstName = client.displayName.split(" ")[0] ?? ""
  // Existing live email, unchanged.
  await sendClientEmail(email, {
    subject: "You're staying — coaching subscription continues | Lisa Fit Method",
    text: [`You're staying, ${firstName}.`, "Your scheduled cancellation has been removed. Your coaching subscription continues exactly as before — same price, same billing date, nothing changes.", "If anything prompted you to consider cancelling, I'd love to hear about it — reply to this email or reach me at contact@lisafitmethod.com.", "Lisa"].join("\n\n"),
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
  })
  return reply({ ok: true })
}
