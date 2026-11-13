import { test } from "node:test"
import assert from "node:assert/strict"
import { monthlyBoundary, planPaidCancellation } from "./cancellation"
import { sub } from "./rules.test"

const ANCHOR = "2026-10-08T01:04:51.000Z"
const NOV8 = "2026-11-08T01:04:51.000Z"
const m2m = { type: "MONTH_TO_MONTH", endDate: null }
const minimum = (endDate: string | null) => ({ type: "THREE_MONTH_MINIMUM", endDate })
// A subscription that started (and renews) on the given date.
const started = (at: string, o: Parameters<typeof sub>[0] = {}) => sub({ billingCycleAnchor: at, startDate: at, ...o })

test("monthly renewals follow Stripe's calendar, including short months", () => {
  assert.equal(monthlyBoundary(ANCHOR, 2), "2026-12-08T01:04:51.000Z")
  assert.equal(monthlyBoundary("2027-01-31T10:00:00.000Z", 1), "2027-02-28T10:00:00.000Z")
  assert.equal(monthlyBoundary("2027-01-31T10:00:00.000Z", 2), "2027-03-31T10:00:00.000Z")
  assert.equal(monthlyBoundary("2028-01-31T10:00:00.000Z", 1), "2028-02-29T10:00:00.000Z", "leap year")
  assert.equal(monthlyBoundary("2026-11-30T00:00:00.000Z", 3), "2027-02-28T00:00:00.000Z")
})

test("month-to-month: ends when the paid period ends, nothing more charged", () => {
  const p = planPaidCancellation({ sub: started(ANCHOR), commitment: m2m })
  assert.deepEqual(p, { kind: "period-end", endsAt: "2026-12-08T01:04:51.000Z", commitmentEndsAt: null, remainingPayments: [] })
})

test("no commitment recorded at all: treated like month-to-month only when the record says so", () => {
  const none = planPaidCancellation({ sub: sub(), commitment: null })
  assert.equal(none.kind, "period-end")
  const unconfirmed = planPaidCancellation({ sub: sub(), commitment: null, commitmentNeedsConfirmation: true })
  assert.deepEqual(unconfirmed, { kind: "unknown", reason: "commitment-unconfirmed" })
})

test("3-month minimum already completed by the current period: ends at period end", () => {
  // Started Sep 8: the third payment was Nov 8, so the commitment ends Dec 8, the current period end.
  const p = planPaidCancellation({ sub: sub({ billingCycleAnchor: "2026-09-08T01:04:51.000Z", startDate: "2026-09-08T01:04:51.000Z" }), commitment: minimum("2026-12-08T01:04:51.000Z") })
  assert.equal(p.kind, "period-end")
  if (p.kind === "period-end") assert.deepEqual(p.remainingPayments, [])
})

test("inside a 3-month minimum: remaining committed payments, then ends on the renewal that completes it", () => {
  // Started Oct 8; commitment to Jan 8; currently paid to Dec 8.
  const p = planPaidCancellation({ sub: started(ANCHOR, { unitAmountCents: 39700 }), commitment: minimum("2027-01-08T01:04:51.000Z"), nextAmountCents: 39700 })
  assert.deepEqual(p, {
    kind: "commitment-end",
    endsAt: "2027-01-08T01:04:51.000Z",
    commitmentEndsAt: "2027-01-08T01:04:51.000Z",
    remainingPayments: [{ date: "2026-12-08T01:04:51.000Z", amountCents: 39700 }],
  })
})

test("cancelling in the first month of a 3-month minimum: two payments still to come", () => {
  const p = planPaidCancellation({ sub: started(NOV8, { currentPeriodEnd: "2026-12-08T01:04:51.000Z", unitAmountCents: 39700 }), commitment: minimum("2027-02-08T01:04:51.000Z"), nextAmountCents: 39700 })
  assert.equal(p.kind, "commitment-end")
  if (p.kind !== "commitment-end") return
  assert.equal(p.endsAt, "2027-02-08T01:04:51.000Z")
  assert.deepEqual(p.remainingPayments.map((x) => x.date), ["2026-12-08T01:04:51.000Z", "2027-01-08T01:04:51.000Z"])
})

test("a commitment end computed from calendar months still lands on Stripe's month-end renewal", () => {
  // Started Jan 31; start + 3 months by calendar arithmetic is May 1, Stripe's 3rd renewal is Apr 30.
  const p = planPaidCancellation({ sub: started("2027-01-31T10:00:00.000Z", { currentPeriodEnd: "2027-02-28T10:00:00.000Z" }), commitment: minimum("2027-05-01T10:00:00.000Z") })
  assert.equal(p.kind, "commitment-end")
  if (p.kind !== "commitment-end") return
  assert.equal(p.endsAt, "2027-04-30T10:00:00.000Z")
  assert.deepEqual(p.remainingPayments.map((x) => x.date), ["2027-02-28T10:00:00.000Z", "2027-03-31T10:00:00.000Z"])
})

test("missing start date on the client record: Stripe's subscription start is used instead of giving up", () => {
  const p = planPaidCancellation({ sub: started(NOV8, { currentPeriodEnd: "2026-12-08T01:04:51.000Z" }), commitment: minimum(null) })
  assert.equal(p.kind, "commitment-end")
  if (p.kind === "commitment-end") {
    assert.equal(p.endsAt, "2027-02-08T01:04:51.000Z")
    assert.equal(p.commitmentEndsAt, "2027-02-08T01:04:51.000Z")
  }
})

test("client record and Stripe disagree about the commitment: unknown, for Lisa to check", () => {
  // Record says the commitment runs to Mar 8, but Stripe started the subscription Nov 8 (ends Feb 8).
  assert.deepEqual(planPaidCancellation({ sub: started(NOV8), commitment: minimum("2027-03-08T01:04:51.000Z") }), { kind: "unknown", reason: "commitment-dates-disagree" })
  // A difference of a day or two (calendar arithmetic, time zones) is not a disagreement.
  assert.equal(planPaidCancellation({ sub: started(NOV8), commitment: minimum("2027-02-09T05:00:00.000Z") }).kind, "commitment-end")
})

test("later amounts are only stated when they can't change", () => {
  const discount = (duration: string) => [{ couponId: "c", percentOff: 10, amountOffCents: null, duration, isBundleCredit: false }]
  const once = planPaidCancellation({ sub: started(NOV8, { unitAmountCents: 39700, discounts: discount("repeating") }), commitment: minimum("2027-02-08T01:04:51.000Z"), nextAmountCents: 35730 })
  assert.equal(once.kind, "commitment-end")
  if (once.kind === "commitment-end") assert.deepEqual(once.remainingPayments.map((x) => x.amountCents), [35730, null])
  const forever = planPaidCancellation({ sub: started(NOV8, { unitAmountCents: 39700, discounts: discount("forever") }), commitment: minimum("2027-02-08T01:04:51.000Z"), nextAmountCents: 35730 })
  assert.equal(forever.kind, "commitment-end")
  if (forever.kind === "commitment-end") assert.deepEqual(forever.remainingPayments.map((x) => x.amountCents), [35730, 35730])
})

test("never guesses: every missing or inconsistent fact gives 'unknown'", () => {
  assert.deepEqual(planPaidCancellation({ sub: null, commitment: m2m }), { kind: "unknown", reason: "no-running-subscription" })
  assert.deepEqual(planPaidCancellation({ sub: sub({ status: "canceled" }), commitment: m2m }), { kind: "unknown", reason: "no-running-subscription" })
  assert.deepEqual(planPaidCancellation({ sub: sub({ pause: { behavior: "void", resumesAt: null } }), commitment: m2m }), { kind: "unknown", reason: "collection-paused" })
  assert.deepEqual(planPaidCancellation({ sub: sub({ interval: "year" }), commitment: m2m }), { kind: "unknown", reason: "not-monthly" })
  assert.deepEqual(planPaidCancellation({ sub: sub({ currentPeriodEnd: null }), commitment: m2m }), { kind: "unknown", reason: "no-period-end" })
  assert.deepEqual(planPaidCancellation({ sub: sub({ startDate: null }), commitment: minimum(null) }), { kind: "unknown", reason: "commitment-dates-missing" })
  assert.deepEqual(planPaidCancellation({ sub: sub({ startDate: NOV8 }), commitment: minimum("not a date") }), { kind: "unknown", reason: "commitment-dates-missing" })
  assert.deepEqual(planPaidCancellation({ sub: sub({ billingCycleAnchor: null, startDate: NOV8 }), commitment: minimum("2027-02-08T01:04:51.000Z") }), { kind: "unknown", reason: "no-billing-anchor" })
  assert.deepEqual(planPaidCancellation({ sub: sub({ billingCycleAnchor: "2026-10-20T00:00:00.000Z", startDate: NOV8 }), commitment: minimum("2027-02-08T01:04:51.000Z") }), { kind: "unknown", reason: "periods-dont-line-up" })
  assert.deepEqual(planPaidCancellation({ sub: sub({ startDate: "2027-06-08T01:04:51.000Z" }), commitment: minimum("2027-09-08T01:04:51.000Z") }), { kind: "unknown", reason: "commitment-too-far" })
})

test("an end Stripe already has is reported, not planned again", () => {
  assert.deepEqual(planPaidCancellation({ sub: sub({ cancelAtPeriodEnd: true }), commitment: m2m }), { kind: "already-scheduled", endsAt: "2026-12-08T01:04:51.000Z" })
  assert.deepEqual(planPaidCancellation({ sub: sub({ cancelAt: "2027-01-08T01:04:51.000Z" }), commitment: m2m }), { kind: "already-scheduled", endsAt: "2027-01-08T01:04:51.000Z" })
})
