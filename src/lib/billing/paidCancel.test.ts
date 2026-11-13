import { test } from "node:test"
import assert from "node:assert/strict"
import { FakeTable } from "@/lib/testing/fakeDynamo"
import { clientCancelPaid, clientKeepCoaching, manageView, paidCancelPreview, SETTLE_AFTER_MS, type Deps } from "./actions"
import { claimPaidCancelNotice, clearPaidCancel, readState, releasePaidCancelNotice } from "./store"
import type { StripeLike } from "./stripeOps"
import type { StripeSubscriptionLike } from "./snapshot"

const EMAIL = "payer@test.example"
const sec = (iso: string) => Date.parse(iso) / 1000

// A paying client's subscription in an in-memory Stripe. Records every write,
// and can fail definitively or time out (before or after applying).
class PaidStripe {
  sub: StripeSubscriptionLike
  writes: Array<{ params: Record<string, unknown>; key?: string }> = []
  failNext: null | "definitive" | "timeout-before" | "timeout-after" = null
  constructor(o: { anchor: string; periodEnd: string; price?: number }) {
    this.sub = {
      id: "sub_paid", status: "active", customer: "cus_paid", cancel_at_period_end: false, cancel_at: null, pause_collection: null, schedule: null,
      billing_cycle_anchor: sec(o.anchor), start_date: sec(o.anchor), collection_method: "charge_automatically", default_payment_method: "pm_1", metadata: { product: "coaching" }, discounts: [],
      items: { data: [{ id: "si_1", quantity: 1, current_period_end: sec(o.periodEnd), price: { unit_amount: o.price ?? 39700, product: "prod_1", currency: "usd", recurring: { interval: "month" } } }] },
    }
  }
  api(): StripeLike {
    return {
      customers: { list: async () => ({ data: [{ id: "cus_paid" }] }) },
      subscriptions: {
        list: async () => ({ data: [structuredClone(this.sub)], has_more: false }),
        retrieve: async () => structuredClone(this.sub),
        update: async (_id, params, o) => {
          this.writes.push({ params, key: o?.idempotencyKey })
          const f = this.failNext
          this.failNext = null
          if (f === "definitive") throw Object.assign(new Error("No such price"), { type: "StripeInvalidRequestError", statusCode: 400 })
          if (f === "timeout-before") throw Object.assign(new Error("Request timed out"), { type: "StripeConnectionError" })
          if ("cancel_at_period_end" in params) this.sub.cancel_at_period_end = params.cancel_at_period_end as boolean
          if ("cancel_at" in params) this.sub.cancel_at = params.cancel_at as number
          if (f === "timeout-after") throw Object.assign(new Error("Request timed out"), { type: "StripeConnectionError" })
          return structuredClone(this.sub)
        },
        cancel: async () => { throw new Error("not expected") },
      },
      invoices: {
        list: async () => ({ data: [] }),
        retrieve: async () => { throw new Error("not expected") },
        voidInvoice: async () => { throw new Error("not expected") },
        createPreview: async () => ({ amount_due: (this.sub.items?.data?.[0]?.price?.unit_amount ?? 0), next_payment_attempt: this.sub.items?.data?.[0]?.current_period_end ?? null }),
      },
    }
  }
}

function setup(o: { commitment?: { type: string; endDate: string | null } | null; needsConfirmation?: boolean; anchor?: string; periodEnd?: string } = {}) {
  const table = new FakeTable(50)
  const stripe = new PaidStripe({ anchor: o.anchor ?? "2026-10-08T01:04:51Z", periodEnd: o.periodEnd ?? "2026-12-08T01:04:51Z" })
  let clock = Date.parse("2026-11-20T15:00:00Z")
  const client = { stripeSubscriptionId: "sub_paid", commitment: o.commitment === undefined ? { type: "MONTH_TO_MONTH", endDate: null } : o.commitment, commitmentNeedsConfirmation: o.needsConfirmation === true }
  const d: Deps = { db: table, stripe: stripe.api(), readClient: async () => client, now: () => new Date(clock) }
  return { table, stripe, d, advance: (ms: number) => { clock += ms } }
}

test("month-to-month: schedules the end at the paid period end, nothing else sent to Stripe", async () => {
  const { d, stripe, table } = setup()
  const r = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(r.ok, true, JSON.stringify(r))
  if (!r.ok) return
  assert.equal(r.endsAt, "2026-12-08T01:04:51.000Z")
  assert.deepEqual(r.remainingPayments, [])
  assert.equal(stripe.writes.length, 1)
  assert.deepEqual(stripe.writes[0]!.params, { cancel_at_period_end: true })
  assert.match(stripe.writes[0]!.key ?? "", /^lfm-billing-/)
  const s = await readState(table, EMAIL)
  assert.equal(s?.mode, "paid", "a paying client stays paid")
  assert.equal(s?.paidCancelEndsAt, "2026-12-08T01:04:51.000Z")
  assert.equal(s?.pendingOpId, null)
})

test("inside a 3-month minimum: ends on the completing renewal, no proration, remaining payment listed", async () => {
  const { d, stripe } = setup({ commitment: { type: "THREE_MONTH_MINIMUM", endDate: "2027-01-08T01:04:51.000Z" } })
  const r = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(r.ok, true, JSON.stringify(r))
  if (!r.ok) return
  assert.equal(r.endsAt, "2027-01-08T01:04:51.000Z")
  assert.deepEqual(r.remainingPayments, [{ date: "2026-12-08T01:04:51.000Z", amountCents: 39700 }])
  assert.deepEqual(stripe.writes[0]!.params, { cancel_at: sec("2027-01-08T01:04:51Z"), proration_behavior: "none" })
})

test("double submit: the second request changes nothing and reports the same date", async () => {
  const { d, stripe } = setup()
  await clientCancelPaid(d, { email: EMAIL })
  const again = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(again.ok, true)
  if (again.ok) {
    assert.equal(again.already, true)
    assert.equal(again.endsAt, "2026-12-08T01:04:51.000Z")
  }
  assert.equal(stripe.writes.length, 1, "Stripe is asked once")
})

test("unknown end date: nothing is sent to Stripe and no operation is started", async () => {
  const { d, stripe, table } = setup({ needsConfirmation: true })
  const r = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.outcome, "unknown-date")
  assert.equal(stripe.writes.length, 0)
  assert.equal(await readState(table, EMAIL), null)
})

test("Stripe refuses: nothing changed, lock released, request can be retried", async () => {
  const { d, stripe, table } = setup()
  stripe.failNext = "definitive"
  const r = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.outcome, "failed")
  assert.equal(stripe.sub.cancel_at_period_end, false)
  const s = await readState(table, EMAIL)
  assert.equal(s?.pendingOpId, null)
  assert.equal(s?.paidCancelEndsAt ?? null, null)
  const retry = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(retry.ok, true)
})

test("Stripe times out after applying: pending, then 'Check again' confirms it from Stripe without a second change", async () => {
  const { d, stripe, table } = setup()
  stripe.failNext = "timeout-after"
  const r = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.outcome, "pending")
  assert.equal((await readState(table, EMAIL))?.pendingStatus, "UNCERTAIN")
  const again = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(again.ok, true, JSON.stringify(again))
  if (again.ok) assert.equal(again.endsAt, "2026-12-08T01:04:51.000Z")
  assert.equal(stripe.writes.length, 1, "no second write: the first one is recognised")
  assert.equal((await readState(table, EMAIL))?.paidCancelEndsAt, "2026-12-08T01:04:51.000Z")
})

test("Stripe times out before applying: pending until settled, then closed as failed and safe to retry", async () => {
  const { d, stripe, table, advance } = setup()
  stripe.failNext = "timeout-before"
  await clientCancelPaid(d, { email: EMAIL })
  advance(SETTLE_AFTER_MS + 1000)
  const retry = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(retry.ok, true, JSON.stringify(retry))
  assert.equal(stripe.sub.cancel_at_period_end, true)
  assert.equal((await readState(table, EMAIL))?.pendingOpId, null)
})

test("confirmation email is claimed once per cancellation; keeping coaching and cancelling again allows a new one", async () => {
  const { d, stripe, table } = setup()
  assert.equal(await claimPaidCancelNotice(table, EMAIL), null, "nothing to send before a confirmed cancellation")
  await clientCancelPaid(d, { email: EMAIL })
  assert.ok(await claimPaidCancelNotice(table, EMAIL))
  assert.equal(await claimPaidCancelNotice(table, EMAIL), null, "only once")
  await releasePaidCancelNotice(table, EMAIL)
  assert.ok(await claimPaidCancelNotice(table, EMAIL), "a failed send is released and retried")
  // The client keeps their coaching, then cancels again later.
  stripe.sub.cancel_at_period_end = false
  await clearPaidCancel(table, EMAIL)
  assert.equal(await claimPaidCancelNotice(table, EMAIL), null)
  await clientCancelPaid(d, { email: EMAIL })
  assert.ok(await claimPaidCancelNotice(table, EMAIL), "the new cancellation gets its own confirmation")
})

test("preview and the cancellation agree; the admin view shows the scheduled end and payments still to come", async () => {
  const { d } = setup({ commitment: { type: "THREE_MONTH_MINIMUM", endDate: "2027-01-08T01:04:51.000Z" } })
  const preview = await paidCancelPreview(d, EMAIL)
  const r = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(preview.kind, "commitment-end")
  assert.ok(r.ok)
  if (preview.kind === "commitment-end" && r.ok) assert.equal(preview.endsAt, r.endsAt)
  const v = await manageView(d, EMAIL)
  assert.equal(v.cancellation.status, "scheduled")
  assert.equal(v.cancellation.endsAt, "2027-01-08T01:04:51.000Z")
  assert.deepEqual(v.cancellation.remainingPayments, [{ date: "2026-12-08T01:04:51.000Z", amountCents: 39700 }])
})

test("Keep my coaching, month-to-month: only the period-end setting is removed, and Stripe's answer is checked", async () => {
  const { d, stripe, table } = setup()
  await clientCancelPaid(d, { email: EMAIL })
  const k = await clientKeepCoaching(d, { email: EMAIL })
  assert.deepEqual(k, { ok: true, changedStripe: true })
  assert.deepEqual(stripe.writes[1]!.params, { cancel_at_period_end: false })
  assert.match(stripe.writes[1]!.key ?? "", /^lfm-billing-/)
  const s = await readState(table, EMAIL)
  assert.equal(s?.paidCancelEndsAt, null)
  assert.equal(s?.pendingOpId, null)
  const again = await clientCancelPaid(d, { email: EMAIL })
  assert.equal(again.ok, true, "they can cancel again later")
  assert.ok(await claimPaidCancelNotice(table, EMAIL), "and get a confirmation for the new cancellation")
})

test("Keep my coaching inside a 3-month minimum: the commitment end date is removed", async () => {
  const { d, stripe } = setup({ commitment: { type: "THREE_MONTH_MINIMUM", endDate: "2027-01-08T01:04:51.000Z" } })
  await clientCancelPaid(d, { email: EMAIL })
  const k = await clientKeepCoaching(d, { email: EMAIL })
  assert.equal(k.ok, true)
  assert.deepEqual(stripe.writes[1]!.params, { cancel_at: "" })
  assert.ok(!stripe.sub.cancel_at)
})

test("Keep my coaching with nothing scheduled in Stripe changes nothing there", async () => {
  const { d, stripe } = setup()
  assert.deepEqual(await clientKeepCoaching(d, { email: EMAIL }), { ok: true, changedStripe: false })
  assert.equal(stripe.writes.length, 0)
})

test("Keep my coaching when Stripe refuses: still scheduled, nothing recorded as kept", async () => {
  const { d, stripe, table } = setup()
  await clientCancelPaid(d, { email: EMAIL })
  stripe.failNext = "definitive"
  const k = await clientKeepCoaching(d, { email: EMAIL })
  assert.equal(k.ok, false)
  assert.equal(stripe.sub.cancel_at_period_end, true)
  const s = await readState(table, EMAIL)
  assert.equal(s?.paidCancelEndsAt, "2026-12-08T01:04:51.000Z")
  assert.equal(s?.pendingOpId, null)
})
