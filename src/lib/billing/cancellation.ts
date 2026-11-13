import type { SubSnapshot } from "./snapshot"
import type { Commitment } from "./rules"

// When a paying client cancels, when does coaching end and what (if anything)
// is still charged before then? Worked out from Stripe's own renewal calendar
// and the commitment the client accepted. If any part can't be established,
// the answer is "unknown" and nothing is guessed.
//
// Month-to-month (or a commitment already fulfilled by the current period):
// coaching ends at the end of the period already paid for; nothing more is
// charged.
// Inside a 3-month minimum: coaching ends on the renewal date that completes
// the commitment. The renewals before that are the remaining committed
// payments; no renewal after it is charged, and nothing is prorated.

export type PlannedPayment = { date: string; amountCents: number | null }

export type PaidCancelPlan =
  | { kind: "period-end"; endsAt: string; commitmentEndsAt: string | null; remainingPayments: PlannedPayment[] }
  | { kind: "commitment-end"; endsAt: string; commitmentEndsAt: string; remainingPayments: PlannedPayment[] }
  | { kind: "already-scheduled"; endsAt: string }
  | { kind: "unknown"; reason: UnknownReason }

export type UnknownReason =
  | "commitment-unconfirmed"
  | "commitment-dates-missing"
  | "commitment-dates-disagree"
  | "no-running-subscription"
  | "collection-paused"
  | "not-monthly"
  | "no-period-end"
  | "no-billing-anchor"
  | "periods-dont-line-up"
  | "commitment-too-far"

// A commitment ending within this of a renewal date is completed by that renewal.
const ALIGN_TOLERANCE_MS = 3 * 864e5
const MATCH_TOLERANCE_MS = 60 * 60 * 1000
const MAX_REMAINING_PAYMENTS = 3
const RUNNING = new Set(["active", "trialing", "past_due"])
// A "3-month minimum" is the first three monthly payments.
const MINIMUM_MONTHS = 3

// Stripe's monthly renewal n months after the anchor: same day and time (UTC),
// or the last day of a shorter month.
export function monthlyBoundary(anchorIso: string, n: number): string {
  const a = new Date(anchorIso)
  const y = a.getUTCFullYear()
  const m = a.getUTCMonth() + n
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const day = Math.min(a.getUTCDate(), lastDay)
  return new Date(Date.UTC(y, m, day, a.getUTCHours(), a.getUTCMinutes(), a.getUTCSeconds())).toISOString()
}

function paymentAmount(sub: SubSnapshot, first: boolean, nextAmountCents: number | null): number | null {
  if (first && nextAmountCents != null) return nextAmountCents
  if (sub.discounts.length === 0) return sub.unitAmountCents != null ? sub.unitAmountCents * sub.quantity : null
  // A discount that lasts forever applies to every renewal alike; any other
  // discount may run out, so later amounts aren't known in advance.
  if (nextAmountCents != null && sub.discounts.every((d) => d.duration === "forever")) return nextAmountCents
  return null
}

export function planPaidCancellation(input: {
  sub: SubSnapshot | null
  commitment: Commitment | null
  commitmentNeedsConfirmation?: boolean
  nextAmountCents?: number | null
}): PaidCancelPlan {
  const { sub, commitment } = input
  if (input.commitmentNeedsConfirmation) return { kind: "unknown", reason: "commitment-unconfirmed" }
  if (!sub || !RUNNING.has(sub.status)) return { kind: "unknown", reason: "no-running-subscription" }
  if (sub.cancelAt) return { kind: "already-scheduled", endsAt: sub.cancelAt }
  if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) return { kind: "already-scheduled", endsAt: sub.currentPeriodEnd }
  if (sub.pause) return { kind: "unknown", reason: "collection-paused" }
  if (sub.interval !== "month") return { kind: "unknown", reason: "not-monthly" }
  if (!sub.currentPeriodEnd) return { kind: "unknown", reason: "no-period-end" }

  const periodEnd = sub.currentPeriodEnd
  const hasMinimum = commitment?.type === "THREE_MONTH_MINIMUM"
  // The commitment is the first three monthly payments, so Stripe's own start
  // date fixes when it ends. The client record's date is a cross-check: if the
  // two disagree, the date is unknown until Lisa checks which is right.
  const recordEnd = hasMinimum ? commitment?.endDate ?? null : null
  if (recordEnd && Number.isNaN(Date.parse(recordEnd))) return { kind: "unknown", reason: "commitment-dates-missing" }
  const stripeEnd = hasMinimum && sub.startDate ? monthlyBoundary(sub.startDate, MINIMUM_MONTHS) : null
  if (hasMinimum && !recordEnd && !stripeEnd) return { kind: "unknown", reason: "commitment-dates-missing" }
  if (recordEnd && stripeEnd && Math.abs(Date.parse(recordEnd) - Date.parse(stripeEnd)) > ALIGN_TOLERANCE_MS) return { kind: "unknown", reason: "commitment-dates-disagree" }
  const commitmentEnd = hasMinimum ? stripeEnd ?? recordEnd : null

  if (!commitmentEnd || Date.parse(commitmentEnd) <= Date.parse(periodEnd) + ALIGN_TOLERANCE_MS) {
    return { kind: "period-end", endsAt: periodEnd, commitmentEndsAt: commitmentEnd, remainingPayments: [] }
  }

  if (!sub.billingCycleAnchor) return { kind: "unknown", reason: "no-billing-anchor" }
  let k = -1
  for (let n = 0; n <= 240; n++) {
    if (Math.abs(Date.parse(monthlyBoundary(sub.billingCycleAnchor, n)) - Date.parse(periodEnd)) <= MATCH_TOLERANCE_MS) { k = n; break }
  }
  if (k < 0) return { kind: "unknown", reason: "periods-dont-line-up" }

  const target = Date.parse(commitmentEnd) - ALIGN_TOLERANCE_MS
  const remainingPayments: PlannedPayment[] = []
  let j = k
  while (Date.parse(monthlyBoundary(sub.billingCycleAnchor, j)) < target) {
    if (remainingPayments.length >= MAX_REMAINING_PAYMENTS) return { kind: "unknown", reason: "commitment-too-far" }
    // The renewal on this date is a committed payment; coaching continues past it.
    remainingPayments.push({ date: j === k ? periodEnd : monthlyBoundary(sub.billingCycleAnchor, j), amountCents: paymentAmount(sub, j === k, input.nextAmountCents ?? null) })
    j++
  }
  return { kind: "commitment-end", endsAt: monthlyBoundary(sub.billingCycleAnchor, j), commitmentEndsAt: commitmentEnd, remainingPayments }
}

// Plain words for Lisa (admin notices) when the end date can't be worked out.
export function unknownReasonForAdmin(r: UnknownReason): string {
  switch (r) {
    case "commitment-unconfirmed": return "Their commitment terms haven't been confirmed in their client record yet."
    case "commitment-dates-missing": return "They're on a 3-month minimum, but neither their client record nor Stripe gives a start date."
    case "commitment-dates-disagree": return "Their 3-month minimum ends on different dates in their client record and in Stripe (subscription start). Check which is right and correct the record, then finish the request."
    case "no-running-subscription": return "There's no running Stripe subscription linked to them."
    case "collection-paused": return "Stripe collection is paused on their subscription."
    case "not-monthly": return "Their Stripe subscription isn't billed monthly."
    case "no-period-end": return "Stripe didn't return their current period end."
    case "no-billing-anchor": return "Stripe didn't return their billing anchor date."
    case "periods-dont-line-up": return "Their Stripe renewal dates don't line up with a monthly calendar."
    case "commitment-too-far": return "Their commitment end is more than 3 renewals away, which doesn't match a 3-month minimum."
  }
}
