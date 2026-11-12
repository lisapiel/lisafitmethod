import { test } from "node:test"
import assert from "node:assert/strict"
import { planComplimentary, voidCheck, collectionView, outstandingInvoices } from "./rules"
import type { InvoiceSnapshot, SubSnapshot } from "./snapshot"

export const sub = (o: Partial<SubSnapshot> = {}): SubSnapshot => ({
  id: "sub_1", status: "active", customerId: "cus_1", itemId: "si_1", productId: "prod_1", unitAmountCents: 100, currency: "usd", interval: "month",
  quantity: 1, itemCount: 1, currentPeriodEnd: "2026-12-08T01:04:51.000Z", cancelAtPeriodEnd: false, cancelAt: null, pause: null, scheduleId: null,
  collectionMethod: "charge_automatically", hasDefaultPaymentMethod: true, discounts: [], metadata: { product: "coaching" }, cancellationReason: null, endedAt: null, ...o,
})
export const inv = (o: Partial<InvoiceSnapshot> = {}): InvoiceSnapshot => ({
  id: "in_1", number: "A-0001", status: "paid", subscriptionId: "sub_1", amountDueCents: 100, amountPaidCents: 100, amountRemainingCents: 0, attemptCount: 1,
  nextPaymentAttempt: null, createdAt: "2026-11-08T01:04:51.000Z", paidAt: "2026-11-08T01:04:55.000Z", hostedInvoiceUrl: null, paymentProcessing: false, ...o,
})
const subs = (linked: SubSnapshot | null, extra: SubSnapshot[] = []) => ({ linkedId: linked?.id ?? null, linked, running: [linked, ...extra].filter((s): s is SubSnapshot => !!s && ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"].includes(s.status)) })

test("a clean active $1 subscription: pause, keeping $1 as the reference price", () => {
  const p = planComplimentary({ mode: "paid", grantActive: false, subs: subs(sub()), invoices: [inv()] })
  assert.equal(p.kind, "pause")
  assert.equal(p.kind === "pause" && p.referencePriceCents, 100)
  assert.deepEqual(p.warnings, [])
  assert.deepEqual(p.outstanding, [])
})

test("open and draft invoices are listed and warned about, never blocked or voided automatically", () => {
  const open = inv({ id: "in_open", status: "open", amountPaidCents: 0, amountRemainingCents: 100, nextPaymentAttempt: "2026-11-15T00:00:00.000Z" })
  const draft = inv({ id: "in_draft", status: "draft", amountPaidCents: 0, amountRemainingCents: 100 })
  const otherSub = inv({ id: "in_x", status: "open", subscriptionId: "sub_other" })
  const p = planComplimentary({ mode: "paid", grantActive: false, subs: subs(sub()), invoices: [open, draft, otherSub, inv()] })
  assert.equal(p.kind, "pause")
  assert.deepEqual(p.outstanding.map((i) => i.id), ["in_open", "in_draft"])
  assert.match(p.warnings.join(" "), /2 invoices from before this change are still outstanding/)
})

test("everything unusual blocks with a reason", () => {
  const cases: Array<[string, Partial<SubSnapshot>]> = [
    ["cancellation-scheduled", { cancelAtPeriodEnd: true }],
    ["cancellation-scheduled", { cancelAt: "2027-02-08T00:00:00.000Z" }],
    ["schedule", { scheduleId: "sub_sched_1" }],
    ["other-pause", { pause: { behavior: "keep_as_draft", resumesAt: null } }],
    ["other-pause", { pause: { behavior: "void", resumesAt: "2027-01-01T00:00:00.000Z" } }],
    ["status", { status: "unpaid" }],
    ["status", { status: "incomplete" }],
    ["send-invoice", { collectionMethod: "send_invoice" }],
    ["items", { itemCount: 2 }],
    ["bundle-credit", { discounts: [{ couponId: "c1", percentOff: null, amountOffCents: 4500, duration: "once", isBundleCredit: true }] }],
  ]
  for (const [code, o] of cases) {
    const p = planComplimentary({ mode: "paid", grantActive: false, subs: subs(sub(o)), invoices: [] })
    assert.equal(p.kind, "blocked", code)
    assert.ok(p.kind === "blocked" && p.blockers.some((b) => b.code === code), `${code}: ${JSON.stringify(p)}`)
  }
})

test("an unlinked running coaching subscription blocks, because it would keep charging", () => {
  const p = planComplimentary({ mode: "paid", grantActive: false, subs: subs(sub(), [sub({ id: "sub_dupe" })]), invoices: [] })
  assert.ok(p.kind === "blocked" && p.blockers[0].code === "unlinked-subscription" && /sub_dupe/.test(p.blockers[0].message))
})

test("a linked subscription missing from Stripe blocks", () => {
  const p = planComplimentary({ mode: "paid", grantActive: false, subs: { linkedId: "sub_gone", linked: null, running: [] }, invoices: [] })
  assert.ok(p.kind === "blocked" && p.blockers[0].code === "linked-missing")
})

test("no subscription at all: record only; already paused in Stripe: record only", () => {
  assert.deepEqual(planComplimentary({ mode: "paid", grantActive: false, subs: subs(null), invoices: [] }).kind, "record-only")
  assert.deepEqual(planComplimentary({ mode: "paid", grantActive: false, subs: subs(sub({ status: "canceled" })), invoices: [] }).kind, "record-only")
  const p = planComplimentary({ mode: "paid", grantActive: false, subs: subs(sub({ pause: { behavior: "void", resumesAt: null } })), invoices: [] })
  assert.ok(p.kind === "record-only" && p.reason === "already-paused")
})

test("already complimentary and paused: nothing to do", () => {
  const p = planComplimentary({ mode: "complimentary", grantActive: true, subs: subs(sub({ pause: { behavior: "void", resumesAt: null } })), invoices: [] })
  assert.ok(p.kind === "blocked" && p.blockers[0].code === "already")
})

test("marked complimentary but Stripe is collecting: offered as a fresh pause", () => {
  assert.equal(planComplimentary({ mode: "complimentary", grantActive: true, subs: subs(sub()), invoices: [] }).kind, "pause")
})

test("past due: allowed, with the reason shown", () => {
  const p = planComplimentary({ mode: "paid", grantActive: false, subs: subs(sub({ status: "past_due" })), invoices: [inv({ status: "open", amountPaidCents: 0, amountRemainingCents: 100 })] })
  assert.equal(p.kind, "pause")
  assert.match(p.warnings.join(" "), /past due/)
})

test("processing payments are flagged", () => {
  const p = planComplimentary({ mode: "paid", grantActive: false, subs: subs(sub()), invoices: [inv({ status: "open", amountPaidCents: 0, amountRemainingCents: 100, paymentProcessing: true })] })
  assert.match(p.warnings.join(" "), /still processing/)
})

test("void check: only open, unpaid, not-processing invoices of the linked subscription", () => {
  const open = inv({ status: "open", amountPaidCents: 0, amountRemainingCents: 100 })
  assert.deepEqual(voidCheck(open, "sub_1"), { ok: true })
  assert.equal(voidCheck(null, "sub_1").ok, false)
  assert.equal(voidCheck(open, "sub_2").ok, false)
  assert.equal(voidCheck(open, null).ok, false)
  assert.match((voidCheck(inv(), "sub_1") as { message: string }).message, /never refunds/)
  assert.equal(voidCheck(inv({ status: "void" }), "sub_1").ok, false)
  assert.equal(voidCheck(inv({ status: "draft", amountPaidCents: 0 }), "sub_1").ok, false)
  assert.equal(voidCheck(inv({ status: "uncollectible", amountPaidCents: 0 }), "sub_1").ok, false)
  assert.equal(voidCheck({ ...open, amountPaidCents: 40, amountRemainingCents: 60 }, "sub_1").ok, false)
  assert.equal(voidCheck({ ...open, paymentProcessing: true }, "sub_1").ok, false)
})

test("outstanding invoices are only those of the given subscription", () => {
  assert.deepEqual(outstandingInvoices(null, [inv({ status: "open" })]), [])
})

test("display: complimentary shows $0 collected and keeps the reference price; no next charge", () => {
  const v = collectionView({ mode: "complimentary", sub: sub({ pause: { behavior: "void", resumesAt: null } }), preview: null })
  assert.equal(v.state, "complimentary")
  assert.equal(v.collectedPerMonthCents, 0)
  assert.equal(v.referencePriceCents, 100)
  assert.equal(v.nextCollection, null)
  assert.equal(v.warning, null)
})

test("display: complimentary with a client cancellation shows when it ends", () => {
  const v = collectionView({ mode: "complimentary", sub: sub({ pause: { behavior: "void", resumesAt: null }, cancelAtPeriodEnd: true }), preview: null })
  // Label changed with the grant model: "until <date>" (was "ends <date>").
  assert.match(v.label, /until 2026-12-08/)
})

test("display: never shows a price as collected when the record and Stripe disagree", () => {
  const collecting = collectionView({ mode: "complimentary", sub: sub(), preview: { amountDueCents: 100, date: "2026-12-08T01:04:51.000Z" } })
  assert.equal(collecting.state, "out-of-sync-collecting")
  assert.ok(collecting.warning)
  const pausedButPaid = collectionView({ mode: "paid", sub: sub({ pause: { behavior: "void", resumesAt: null } }), preview: null })
  assert.equal(pausedButPaid.state, "out-of-sync-paused")
  assert.equal(pausedButPaid.collectedPerMonthCents, 0)
})

test("display: paid uses Stripe's preview for the next charge and explains a difference", () => {
  const v = collectionView({ mode: "paid", sub: sub({ unitAmountCents: 39700 }), preview: { amountDueCents: 35200, date: "2026-12-08T01:04:51.000Z" } })
  assert.equal(v.state, "paid")
  assert.equal(v.label, "Paid · $397/month")
  assert.deepEqual(v.nextCollection, { date: "2026-12-08T01:04:51.000Z", amountCents: 35200, note: "Lower than the price because of a discount or account credit." })
})

test("display: cancelling, past due, ended and no subscription", () => {
  assert.equal(collectionView({ mode: "paid", sub: sub({ cancelAtPeriodEnd: true }), preview: null }).state, "cancelling")
  assert.equal(collectionView({ mode: "paid", sub: sub({ status: "past_due" }), preview: null }).state, "past-due")
  assert.equal(collectionView({ mode: "paid", sub: sub({ status: "canceled" }), preview: null }).state, "ended")
  assert.equal(collectionView({ mode: "paid", sub: null, preview: null }).state, "no-subscription")
})
