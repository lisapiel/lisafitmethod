import { test } from "node:test"
import assert from "node:assert/strict"
import { FakeTable } from "@/lib/testing/fakeDynamo"
import { makeComplimentary, voidOutstandingInvoice, recordPaid, reconcile, manageView, setComplimentaryEnd, endComplimentary, clientCancelComplimentary, cancelPausedSubscription, SETTLE_AFTER_MS, type Deps } from "./actions"
import { coachingAccessDecision, complimentaryStatus, isComplimentaryActive, paysForCoaching } from "./entitlement"
import { readState, readOp, listOps, claimCancelNotice, releaseCancelNotice } from "./store"
import { decideOnSubscriptionDeleted } from "./revocation"
import type { StripeLike } from "./stripeOps"
import type { StripeInvoiceLike, StripeSubscriptionLike } from "./snapshot"

const EMAIL = "client@test.example"

// A small in-memory Stripe: one customer, its subscriptions and invoices.
// Writes record their parameters and idempotency keys, and can be told to
// fail definitively, time out before applying, or time out after applying.
class FakeStripe {
  subs = new Map<string, StripeSubscriptionLike>()
  invoices = new Map<string, StripeInvoiceLike>()
  writes: Array<{ call: string; id: string; params: Record<string, unknown>; key?: string }> = []
  failNext: null | "definitive" | "timeout-before" | "timeout-after" = null
  previewCalls = 0

  constructor() {
    this.subs.set("sub_1", {
      id: "sub_1", status: "active", customer: "cus_1", cancel_at_period_end: false, cancel_at: null, pause_collection: null, schedule: null,
      collection_method: "charge_automatically", default_payment_method: "pm_1", metadata: { product: "coaching", customerEmail: EMAIL }, discounts: [],
      items: { data: [{ id: "si_1", quantity: 1, current_period_end: Date.parse("2026-12-08T01:04:51Z") / 1000, price: { unit_amount: 100, product: "prod_1", currency: "usd", recurring: { interval: "month" } } }] },
    })
    this.invoices.set("in_paid", { id: "in_paid", number: "A-1", status: "paid", amount_due: 100, amount_paid: 100, amount_remaining: 0, created: 1762563891, parent: { subscription_details: { subscription: "sub_1" } } })
  }

  private maybeFail(apply: () => void) {
    const f = this.failNext
    this.failNext = null
    if (f === "definitive") throw Object.assign(new Error("Your card was declined."), { type: "StripeInvalidRequestError", statusCode: 400 })
    if (f === "timeout-before") throw Object.assign(new Error("Request timed out"), { type: "StripeConnectionError" })
    apply()
    if (f === "timeout-after") throw Object.assign(new Error("Request timed out"), { type: "StripeConnectionError" })
  }

  api(): StripeLike {
    return {
      customers: { list: async () => ({ data: [{ id: "cus_1" }] }) },
      subscriptions: {
        list: async () => ({ data: [...this.subs.values()], has_more: false }),
        retrieve: async (id) => {
          const s = this.subs.get(id)
          if (!s) throw Object.assign(new Error("No such subscription"), { type: "StripeInvalidRequestError", statusCode: 404 })
          return structuredClone(s)
        },
        update: async (id, params, o) => {
          this.writes.push({ call: "subscriptions.update", id, params, key: o?.idempotencyKey })
          const s = this.subs.get(id)!
          this.maybeFail(() => {
            const pc = params.pause_collection as { behavior: string } | undefined
            if (pc) s.pause_collection = { behavior: pc.behavior, resumes_at: null }
            if (params.metadata) s.metadata = { ...s.metadata, ...(params.metadata as Record<string, string>) }
            if ("cancel_at_period_end" in params) s.cancel_at_period_end = params.cancel_at_period_end as boolean
          })
          return structuredClone(s)
        },
        cancel: async (id, params, o) => {
          this.writes.push({ call: "subscriptions.cancel", id, params: params ?? {}, key: o?.idempotencyKey })
          const s = this.subs.get(id)!
          this.maybeFail(() => { s.status = "canceled" })
          return structuredClone(s)
        },
      },
      invoices: {
        list: async () => ({ data: [...this.invoices.values()] }),
        retrieve: async (id) => structuredClone(this.invoices.get(id)!),
        voidInvoice: async (id, _p, o) => {
          this.writes.push({ call: "invoices.voidInvoice", id, params: {}, key: o?.idempotencyKey })
          const i = this.invoices.get(id)!
          this.maybeFail(() => { i.status = "void" })
          return structuredClone(i)
        },
        createPreview: async () => { this.previewCalls++; return { amount_due: 100, next_payment_attempt: Date.parse("2026-12-08T02:04:51Z") / 1000 } },
      },
    }
  }
}

function setup(o: { client?: Record<string, unknown> | null } = {}) {
  const table = new FakeTable(50)
  const stripe = new FakeStripe()
  let clock = Date.parse("2026-11-12T15:00:00Z")
  const client = o.client === undefined ? { stripeSubscriptionId: "sub_1" } : o.client
  const d: Deps = { db: table, stripe: stripe.api(), readClient: async () => client, now: () => new Date(clock) }
  return { table, stripe, d, advance: (ms: number) => { clock += ms } }
}
const confirm = { subscriptionId: "sub_1" }
const ADMIN = "coach@test.example"
const REASON = "Family member; coaching is on me"

test("Make Complimentary: pauses collection with void, records it, leaves access alone", async () => {
  const { d, stripe, table } = setup()
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  assert.equal(r.ok, true, JSON.stringify(r))
  assert.equal(stripe.writes.length, 1)
  const w = stripe.writes[0]
  assert.deepEqual(Object.keys(w.params).sort(), ["metadata", "pause_collection"], "nothing but the pause and our metadata is sent")
  assert.deepEqual(w.params.pause_collection, { behavior: "void" })
  assert.match(w.key ?? "", /^lfm-billing-/)
  assert.equal(stripe.subs.get("sub_1")!.status, "active")
  const state = await readState(table, EMAIL)
  assert.equal(state?.mode, "complimentary")
  assert.equal(state?.referencePriceCents, 100)
  assert.equal(state?.modeBy, ADMIN)
  assert.equal(state?.pendingOpId, null)
  const ops = await listOps(table, EMAIL)
  assert.equal(ops.length, 1)
  assert.deepEqual(ops[0].history.map((h) => h.status), ["PENDING", "APPLIED", "COMPLETED"])
  // The audit record now also keeps the paid commitment in place (none for this client).
  assert.deepEqual(ops[0].before, { mode: "paid", collectingCents: 100, commitmentType: null, commitmentEndDate: null })
  assert.ok(![...table.items.keys()].some((k) => k.startsWith("coaching_access_")), "no access record was written")
})

test("a stale confirmation changes nothing and calls nothing", async () => {
  const { d, stripe, table } = setup()
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: "sub_other" }, reason: REASON })
  assert.equal(r.ok, false)
  assert.equal(stripe.writes.length, 0)
  assert.equal(await readState(table, EMAIL), null)
})

test("blocked plans change nothing", async () => {
  const { d, stripe } = setup()
  stripe.subs.get("sub_1")!.cancel_at_period_end = true
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  assert.ok(!r.ok && r.status === 409 && r.blockers?.[0].code === "cancellation-scheduled")
  assert.equal(stripe.writes.length, 0)
})

test("Stripe refuses: nothing changes here, the failure is recorded, the lock is released", async () => {
  const { d, stripe, table } = setup()
  stripe.failNext = "definitive"
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  assert.ok(!r.ok && r.status === 502 && !r.uncertain)
  const state = await readState(table, EMAIL)
  assert.equal(state?.mode, "paid")
  assert.equal(state?.pendingOpId, null)
  const [op] = await listOps(table, EMAIL)
  assert.equal(op.status, "FAILED")
  assert.match(op.error ?? "", /declined/)
  // and a retry works
  const again = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  assert.equal(again.ok, true)
})

test("no answer from Stripe, and it never applied: stays locked, guard protects access, closed as failed later", async () => {
  const { d, stripe, table, advance } = setup()
  stripe.failNext = "timeout-before"
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  assert.ok(!r.ok && r.uncertain)
  const locked = await readState(table, EMAIL)
  assert.equal(locked?.pendingKind, "MAKE_COMPLIMENTARY")
  assert.equal(locked?.pendingStatus, "UNCERTAIN")
  // While uncertain, a deletion can't end their coaching.
  const decision = decideOnSubscriptionDeleted({
    deleted: { id: "sub_1", pause: null, metadata: { product: "coaching" }, cancellationReason: "payment_failed", cancelAtPeriodEnd: false, cancelAt: null },
    client: { stripeSubscriptionId: "sub_1" },
    billing: { mode: locked!.mode, grantActive: false, pendingKind: locked!.pendingKind, pendingStatus: locked!.pendingStatus },
  })
  assert.equal(decision.action, "keep")
  // A second change is refused while this is unsettled.
  const busy = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  assert.ok(!busy.ok && busy.status === 409)
  // Soon after: still waiting.
  assert.match((await reconcile(d, EMAIL)) ?? "", /still being confirmed/)
  // Later: Stripe never applied it, so it's closed as failed and released.
  advance(SETTLE_AFTER_MS + 1000)
  assert.match((await reconcile(d, EMAIL)) ?? "", /didn't reach Stripe/)
  const after = await readState(table, EMAIL)
  assert.equal(after?.mode, "paid")
  assert.equal(after?.pendingOpId, null)
  assert.equal(stripe.subs.get("sub_1")!.pause_collection, null)
})

test("no answer from Stripe, but it did apply: the next load confirms it from Stripe and records it", async () => {
  const { d, stripe, table } = setup()
  stripe.failNext = "timeout-after"
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  assert.ok(!r.ok && r.uncertain)
  const view = await manageView(d, EMAIL)
  assert.match(view.notice ?? "", /confirmed by Stripe/)
  assert.equal(view.mode, "complimentary")
  assert.equal(view.collection.state, "complimentary")
  const [op] = await listOps(table, EMAIL)
  assert.deepEqual(op.history.map((h) => h.status), ["PENDING", "UNCERTAIN", "APPLIED", "COMPLETED"])
})

test("crash after Stripe applied but before our record saved: reconciled on the next load", async () => {
  const { d, table } = setup()
  // Fail every write to the client's billing record after the lock is taken.
  const realSend = table.send.bind(table)
  let lockTaken = false
  table.send = async (c: unknown) => {
    const item = (c as { input?: { Item?: { userId?: string; pendingOpId?: string | null } } }).input?.Item
    if (item?.userId === `coaching_billing_${EMAIL}`) {
      if (lockTaken && item.pendingOpId === null) throw new Error("connection reset")
      if (item.pendingOpId) lockTaken = true
    }
    return realSend(c)
  }
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  assert.equal(r.ok, true)
  assert.match(r.message, /completes automatically/)
  assert.equal((await readState(table, EMAIL))?.mode, "paid", "our record didn't save")
  table.send = realSend
  const view = await manageView(d, EMAIL)
  assert.equal(view.mode, "complimentary")
  assert.equal(view.pending, null)
})

test("repeating the same request (double click) can't apply twice", async () => {
  const { d, stripe } = setup()
  const [a, b] = await Promise.all([
    makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON }),
    makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON }),
  ])
  const oks = [a, b].filter((x) => x.ok).length
  assert.equal(oks, 1, JSON.stringify([a, b]))
  assert.equal(stripe.writes.filter((w) => w.call === "subscriptions.update").length, 1)
})

test("already paused in Stripe: recorded without calling Stripe", async () => {
  const { d, stripe, table } = setup()
  stripe.subs.get("sub_1")!.pause_collection = { behavior: "void", resumes_at: null }
  const view = await manageView(d, EMAIL)
  assert.equal(view.collection.state, "out-of-sync-paused")
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: null }, reason: REASON })
  assert.equal(r.ok, true, JSON.stringify(r))
  assert.equal(stripe.writes.length, 0)
  assert.equal((await readState(table, EMAIL))?.mode, "complimentary")
})

test("client with no subscription: recorded as complimentary without Stripe", async () => {
  const { d, stripe, table } = setup({ client: { stripeSubscriptionId: null } })
  stripe.subs.clear()
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: null }, reason: REASON })
  assert.equal(r.ok, true)
  assert.equal((await readState(table, EMAIL))?.mode, "complimentary")
})

test("outstanding invoices block Make Complimentary, are never voided by it, and are voided only on request", async () => {
  const { d, stripe, table } = setup()
  stripe.invoices.set("in_open", { id: "in_open", number: "A-2", status: "open", amount_due: 100, amount_paid: 0, amount_remaining: 100, created: 1765156000, parent: { subscription_details: { subscription: "sub_1" } } })
  const before = await manageView(d, EMAIL)
  assert.deepEqual(before.outstanding.map((i) => i.id), ["in_open"])
  // Rule of 2026-11-12: Make Complimentary waits until outstanding invoices are handled separately.
  const blocked = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  assert.ok(!blocked.ok && blocked.blockers?.some((b) => b.code === "outstanding-invoices"))
  assert.equal(stripe.writes.length, 0, "nothing sent to Stripe")
  assert.equal(stripe.invoices.get("in_open")!.status, "open", "not voided automatically")

  const wrong = await voidOutstandingInvoice(d, { email: EMAIL, admin: ADMIN, invoiceId: "in_open", confirmAmountCents: 999 })
  assert.ok(!wrong.ok)
  const paid = await voidOutstandingInvoice(d, { email: EMAIL, admin: ADMIN, invoiceId: "in_paid", confirmAmountCents: 0 })
  assert.ok(!paid.ok && /never refunds/.test(paid.message))
  const r = await voidOutstandingInvoice(d, { email: EMAIL, admin: ADMIN, invoiceId: "in_open", confirmAmountCents: 100 })
  assert.equal(r.ok, true, JSON.stringify(r))
  assert.equal(stripe.invoices.get("in_open")!.status, "void")
  assert.equal(stripe.invoices.get("in_paid")!.status, "paid")
  assert.equal((await readState(table, EMAIL))?.mode, "paid", "voiding doesn't change the mode")
  // With nothing outstanding, Make Complimentary now goes ahead.
  assert.equal((await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })).ok, true)
  const kinds = (await listOps(table, EMAIL)).map((o) => `${o.kind}:${o.status}`).sort()
  assert.deepEqual(kinds, ["MAKE_COMPLIMENTARY:COMPLETED", "VOID_INVOICE:COMPLETED"])
})

test("void with no answer from Stripe: confirmed from Stripe on the next load", async () => {
  const { d, stripe, table } = setup()
  stripe.invoices.set("in_open", { id: "in_open", status: "open", amount_due: 100, amount_paid: 0, amount_remaining: 100, created: 1765156000, parent: { subscription_details: { subscription: "sub_1" } } })
  stripe.failNext = "timeout-after"
  const r = await voidOutstandingInvoice(d, { email: EMAIL, admin: ADMIN, invoiceId: "in_open", confirmAmountCents: 100 })
  assert.ok(!r.ok && r.uncertain)
  await manageView(d, EMAIL)
  const [op] = await listOps(table, EMAIL)
  assert.equal(op.status, "COMPLETED")
})

test("recovery: marked complimentary while Stripe collects is shown, and can be recorded as paid", async () => {
  // Rewritten for the grant model: the old accessType shortcut no longer makes anyone complimentary.
  // The real out-of-sync case is a proper grant whose Stripe pause was later removed outside the app.
  const { d, table, stripe } = setup()
  assert.equal((await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })).ok, true)
  stripe.subs.get("sub_1")!.pause_collection = null
  const view = await manageView(d, EMAIL)
  assert.equal(view.mode, "complimentary")
  assert.equal(view.collection.state, "out-of-sync-collecting")
  const r = await recordPaid(d, { email: EMAIL, admin: ADMIN })
  assert.equal(r.ok, true)
  assert.equal((await readState(table, EMAIL))?.mode, "paid")
})

test("record as paid is refused while Stripe isn't collecting", async () => {
  const { d } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  const r = await recordPaid(d, { email: EMAIL, admin: ADMIN })
  assert.ok(!r.ok && /Resume Paid Coaching/.test(r.message))
})

test("the management view: paid client shows Stripe's next charge; complimentary shows none", async () => {
  const { d, stripe } = setup()
  const paid = await manageView(d, EMAIL)
  assert.equal(paid.collection.state, "paid")
  assert.equal(paid.collection.nextCollection?.amountCents, 100)
  assert.equal(paid.complimentary.kind, "pause")
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  const calls = stripe.previewCalls
  const comp = await manageView(d, EMAIL)
  assert.equal(comp.collection.state, "complimentary")
  assert.equal(comp.collection.nextCollection, null)
  assert.equal(stripe.previewCalls, calls, "no preview for complimentary")
  assert.equal(comp.history[0].kind, "MAKE_COMPLIMENTARY")
  assert.equal(comp.history[0].requestedBy, ADMIN)
})

test("operations are write-once records", async () => {
  const { d, table } = setup()
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  const op = await readOp(table, (r as { opId: string }).opId)
  assert.equal(op?.status, "COMPLETED")
  assert.equal(op?.opRev, 2)
})

// ── Approved grant model (2026-11-12) ──────────────────────────────────────
// Expected outcomes come from Lisa's rules: one explicit admin grant with a
// reason and an optional end date; no paid commitment while complimentary;
// ending it never resumes billing; a client's cancellation ends coaching at
// the end of the current period without any commitment.

const COMMITTED = { stripeSubscriptionId: "sub_1", commitment: { type: "THREE_MONTH_MINIMUM", endDate: "2027-01-08T01:04:51.000Z" } }

test("grant: a reason is required; nothing is sent to Stripe or saved without one", async () => {
  const { d, stripe, table } = setup()
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: "   " })
  assert.ok(!r.ok && r.status === 400)
  assert.equal(stripe.writes.length, 0)
  assert.equal(await readState(table, EMAIL), null)
})

test("grant: indefinite by default, with who, when and why recorded", async () => {
  const { d, table } = setup()
  assert.equal((await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })).ok, true)
  const s = complimentaryStatus(await readState(table, EMAIL), new Date("2026-11-12T15:00:00Z"))
  assert.ok(s.state === "active")
  assert.equal(s.endsAt, null)
  assert.equal(s.reason, REASON)
  assert.equal(s.by, ADMIN)
  assert.equal(s.since, "2026-11-12T15:00:00.000Z")
})

test("grant: an optional end date is stored to the end of that day; a past date is refused before anything happens", async () => {
  const { d, table, stripe } = setup()
  const bad = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON, endsAt: "2026-11-01" })
  assert.ok(!bad.ok && bad.status === 400)
  assert.equal(stripe.writes.length, 0)
  const ok = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON, endsAt: "2027-02-28" })
  assert.ok(ok.ok && /until 2027-02-28/.test(ok.message))
  assert.equal((await readState(table, EMAIL))?.compEndsAt, "2027-02-28T23:59:59.000Z")
})

test("commitment: shown before confirming, recorded as waived, and never changed in Stripe", async () => {
  const { d, table, stripe } = setup({ client: COMMITTED })
  const view = await manageView(d, EMAIL)
  assert.ok(view.complimentary.warnings.some((w) => /3-month commitment until 2027-01-08/.test(w) && /isn't subject to it/.test(w)))
  assert.equal((await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })).ok, true)
  // Only the pause and our markers were sent: no cancel_at, no change to the commitment in Stripe.
  assert.deepEqual(Object.keys(stripe.writes[0].params).sort(), ["metadata", "pause_collection"])
  assert.equal(stripe.subs.get("sub_1")!.cancel_at, null)
  const state = await readState(table, EMAIL)
  assert.deepEqual(state?.compCommitment, { type: "THREE_MONTH_MINIMUM", endDate: "2027-01-08T01:04:51.000Z" })
  const [op] = await listOps(table, EMAIL)
  assert.equal(op.before.commitmentEndDate, "2027-01-08T01:04:51.000Z")
  assert.deepEqual((await manageView(d, EMAIL)).waivedCommitment, { type: "THREE_MONTH_MINIMUM", endDate: "2027-01-08T01:04:51.000Z" })
})

test("change end date: audited, no Stripe call; can set, move and remove it", async () => {
  const { d, table, stripe } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  const writes = stripe.writes.length
  assert.ok((await setComplimentaryEnd(d, { email: EMAIL, admin: ADMIN, endsAt: "2027-03-31" })).ok)
  assert.equal((await readState(table, EMAIL))?.compEndsAt, "2027-03-31T23:59:59.000Z")
  assert.ok((await setComplimentaryEnd(d, { email: EMAIL, admin: ADMIN, endsAt: null })).ok)
  assert.equal((await readState(table, EMAIL))?.compEndsAt, null)
  assert.equal(stripe.writes.length, writes, "no Stripe calls")
  const kinds = (await listOps(table, EMAIL)).map((o) => o.kind)
  assert.deepEqual(kinds.filter((k) => k === "SET_COMPLIMENTARY_END").length, 2)
})

test("change end date / end now: refused for a client who isn't complimentary", async () => {
  const { d } = setup()
  assert.ok(!(await setComplimentaryEnd(d, { email: EMAIL, admin: ADMIN, endsAt: "2027-03-31" })).ok)
  assert.ok(!(await endComplimentary(d, { email: EMAIL, admin: ADMIN, note: "x" })).ok)
})

test("end now: access ends, Stripe is untouched (still paused, nothing resumed), and it can be granted again", async () => {
  const { d, table, stripe } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  const writes = stripe.writes.length
  assert.ok(!(await endComplimentary(d, { email: EMAIL, admin: ADMIN, note: "" })).ok, "a note is required")
  const r = await endComplimentary(d, { email: EMAIL, admin: ADMIN, note: "Coaching finished" })
  assert.ok(r.ok && /paid billing was not resumed/.test(r.message))
  assert.equal(stripe.writes.length, writes, "no Stripe calls")
  assert.deepEqual(stripe.subs.get("sub_1")!.pause_collection, { behavior: "void", resumes_at: null })
  const state = await readState(table, EMAIL)
  assert.equal(state?.mode, "complimentary", "never switched back to paid")
  assert.equal(coachingAccessDecision({ switchActive: true, billing: state, now: new Date("2026-11-12T15:00:00Z") }).access, false)
  const view = await manageView(d, EMAIL)
  assert.equal(view.collection.state, "complimentary-ended")
  assert.equal(view.collection.collectedPerMonthCents, 0)
  // Granting again is allowed and starts a fresh grant.
  assert.equal(view.complimentary.kind, "record-only")
  assert.ok((await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: null }, reason: "Back on complimentary" })).ok)
  assert.equal(isComplimentaryActive(await readState(table, EMAIL), new Date("2026-11-12T15:00:00Z")), true)
})

test("end date passes: access ends on its own, with no Stripe call and no paid billing", async () => {
  const { d, table, stripe, advance } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON, endsAt: "2026-11-30" })
  const writes = stripe.writes.length
  advance(20 * 24 * 3600 * 1000)
  const view = await manageView(d, EMAIL)
  assert.equal(view.comp.state, "ended")
  assert.equal(view.collection.state, "complimentary-ended")
  assert.equal(stripe.writes.length, writes)
  assert.equal(paysForCoaching({ switchActive: true, billing: await readState(table, EMAIL), now: new Date("2026-12-02T15:00:00Z") }), false)
})

test("client cancels: no commitment; coaching runs to the end of the period; only cancel_at_period_end is sent", async () => {
  const { d, table, stripe } = setup({ client: COMMITTED })
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  const r = await clientCancelComplimentary(d, { email: EMAIL })
  assert.ok(r.ok, JSON.stringify(r))
  // Period end of the fake subscription is 2026-12-08T01:04:51Z; the commitment (2027-01-08) is not applied.
  assert.equal(r.ok && r.effectiveDate, "2026-12-08T01:04:51.000Z")
  const last = stripe.writes.at(-1)!
  assert.deepEqual(last.params, { cancel_at_period_end: true })
  assert.match(last.key ?? "", /^lfm-billing-/)
  const s = complimentaryStatus(await readState(table, EMAIL), new Date("2026-11-12T15:00:00Z"))
  assert.ok(s.state === "active" && s.endsBecause === "client-cancelled" && s.endsAt === "2026-12-08T01:04:51.000Z")
  // Asking again changes nothing.
  const again = await clientCancelComplimentary(d, { email: EMAIL })
  assert.ok(again.ok && /already scheduled/.test(again.message))
  assert.equal(stripe.writes.filter((w) => "cancel_at_period_end" in w.params).length, 1)
})

test("client cancels: an earlier end date set by Lisa still wins", async () => {
  const { d } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON, endsAt: "2026-11-30" })
  const r = await clientCancelComplimentary(d, { email: EMAIL })
  assert.equal(r.ok && r.effectiveDate, "2026-11-30T23:59:59.000Z")
})

test("after a client cancels, an admin can bring the end forward but not extend it", async () => {
  const { d } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  await clientCancelComplimentary(d, { email: EMAIL })
  assert.ok(!(await setComplimentaryEnd(d, { email: EMAIL, admin: ADMIN, endsAt: "2027-01-31" })).ok)
  assert.ok(!(await setComplimentaryEnd(d, { email: EMAIL, admin: ADMIN, endsAt: null })).ok)
  assert.ok((await setComplimentaryEnd(d, { email: EMAIL, admin: ADMIN, endsAt: "2026-11-25" })).ok)
})

test("client cancel with no answer from Stripe: confirmed from Stripe on the next load", async () => {
  const { d, table, stripe } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  stripe.failNext = "timeout-after"
  const r = await clientCancelComplimentary(d, { email: EMAIL })
  assert.ok(!r.ok && r.uncertain)
  await manageView(d, EMAIL)
  const s = complimentaryStatus(await readState(table, EMAIL), new Date("2026-11-12T15:00:00Z"))
  assert.ok(s.state === "active" && s.endsBecause === "client-cancelled")
})

test("an interrupted Make Complimentary finishes with the full grant: reason and end date are not lost", async () => {
  const { d, table, stripe } = setup()
  stripe.failNext = "timeout-after"
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON, endsAt: "2027-02-28" })
  assert.ok(!r.ok && r.uncertain)
  await manageView(d, EMAIL)
  const state = await readState(table, EMAIL)
  assert.equal(state?.mode, "complimentary")
  assert.equal(state?.compReason, REASON)
  assert.equal(state?.compEndsAt, "2027-02-28T23:59:59.000Z")
  assert.equal(state?.modeBy, ADMIN)
})

test("grant changes can't collide with a billing change still being confirmed", async () => {
  const { d, stripe } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  stripe.failNext = "timeout-before"
  await clientCancelComplimentary(d, { email: EMAIL })
  const r = await setComplimentaryEnd(d, { email: EMAIL, admin: ADMIN, endsAt: "2026-11-25" })
  assert.ok(!r.ok && r.status === 409)
})

test("webhook guard with the real record: an active grant keeps access; after it ends, deletion ends access normally", async () => {
  const { d, table } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  const now = new Date("2026-11-12T15:00:00Z")
  const del = { id: "sub_1", pause: { behavior: "void" as const, resumesAt: null }, metadata: { product: "coaching", lfm_billing_mode: "complimentary" }, cancellationReason: "payment_failed", cancelAtPeriodEnd: false, cancelAt: null }
  let state = await readState(table, EMAIL)
  assert.equal(decideOnSubscriptionDeleted({ deleted: del, client: { stripeSubscriptionId: "sub_1" }, billing: { mode: state!.mode, grantActive: isComplimentaryActive(state, now) } }).action, "keep")
  await endComplimentary(d, { email: EMAIL, admin: ADMIN, note: "Finished" })
  state = await readState(table, EMAIL)
  assert.deepEqual(decideOnSubscriptionDeleted({ deleted: del, client: { stripeSubscriptionId: "sub_1" }, billing: { mode: state!.mode, grantActive: isComplimentaryActive(state, now) } }), { action: "revoke", reason: "complimentary-already-ended" })
})

// ── Approved 2026-11-12: admin may cancel the paused subscription after complimentary ends ──

test("cancel paused subscription: refused while complimentary is active, or for a paid client", async () => {
  const { d, stripe } = setup()
  assert.ok(!(await cancelPausedSubscription(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: "sub_1" } })).ok, "paid client")
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  const r = await cancelPausedSubscription(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: "sub_1" } })
  assert.ok(!r.ok && /still active/.test(r.message))
  assert.equal(stripe.writes.filter((w) => w.call === "subscriptions.cancel").length, 0)
  assert.equal((await manageView(d, EMAIL)).cancelPausedSubscription, null, "not offered while active")
})

test("cancel paused subscription: offered after complimentary ends; cancels only that subscription, now, with no final invoice", async () => {
  const { d, stripe, table } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  await endComplimentary(d, { email: EMAIL, admin: ADMIN, note: "Finished" })
  const view = await manageView(d, EMAIL)
  assert.deepEqual(view.cancelPausedSubscription, { subscriptionId: "sub_1" })
  assert.ok(!(await cancelPausedSubscription(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: "sub_other" } })).ok, "stale confirmation refused")
  const r = await cancelPausedSubscription(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: "sub_1" } })
  assert.ok(r.ok, JSON.stringify(r))
  const w = stripe.writes.filter((x) => x.call === "subscriptions.cancel")
  assert.equal(w.length, 1)
  assert.deepEqual(w[0].params, { invoice_now: false, prorate: false })
  assert.match(w[0].key ?? "", /^lfm-billing-/)
  assert.equal(stripe.subs.get("sub_1")!.status, "canceled")
  assert.equal((await readState(table, EMAIL))?.mode, "complimentary", "never switched to paid")
  assert.ok((await listOps(table, EMAIL)).some((o) => o.kind === "CANCEL_PAUSED_SUBSCRIPTION" && o.status === "COMPLETED"))
})

test("cancel paused subscription: no answer from Stripe is confirmed from Stripe on the next load", async () => {
  const { d, stripe, table } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  await endComplimentary(d, { email: EMAIL, admin: ADMIN, note: "Finished" })
  stripe.failNext = "timeout-after"
  const r = await cancelPausedSubscription(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: "sub_1" } })
  assert.ok(!r.ok && r.uncertain)
  await manageView(d, EMAIL)
  assert.ok((await listOps(table, EMAIL)).some((o) => o.kind === "CANCEL_PAUSED_SUBSCRIPTION" && o.status === "COMPLETED"))
})

test("client with no Stripe subscription cancels: coaching runs to the complimentary arrangement's own monthly cycle", async () => {
  const { d, table, stripe } = setup({ client: { stripeSubscriptionId: null } })
  stripe.subs.clear()
  // Granted at the test clock (2026-11-12T15:00Z); next monthly cycle end: 2026-12-12T15:00Z.
  assert.ok((await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: null }, reason: REASON })).ok)
  const r = await clientCancelComplimentary(d, { email: EMAIL })
  assert.equal(r.ok && r.effectiveDate, "2026-12-12T15:00:00.000Z")
  assert.equal((await readState(table, EMAIL))?.compEndReason, "client-cancelled")
})

// ── Approved 2026-11-12: never guess an end date; confirmation email only once, after confirmation ──

test("client cancel: if Stripe's current period can't be established, nothing changes and nothing is sent", async () => {
  const { d, stripe, table } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  const item = stripe.subs.get("sub_1")?.items?.data?.[0] as { current_period_end?: number | null } | undefined
  assert.ok(item)
  item.current_period_end = null
  const writes = stripe.writes.length
  const r = await clientCancelComplimentary(d, { email: EMAIL })
  assert.ok(!r.ok && r.status === 409 && /couldn't work out your end date/.test(r.message))
  assert.equal(stripe.writes.length, writes, "no Stripe call")
  const state = await readState(table, EMAIL)
  assert.equal(state?.compEndReason ?? null, null, "no cancellation recorded")
  assert.equal(await claimCancelNotice(table, EMAIL), null, "nothing to email")
})

test("cancellation notice: claimable only after the cancellation is confirmed, and only once", async () => {
  const { d, table } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  assert.equal(await claimCancelNotice(table, EMAIL), null, "not before a cancellation")
  await clientCancelComplimentary(d, { email: EMAIL })
  const first = await claimCancelNotice(table, EMAIL, "2026-11-12T15:01:00.000Z")
  assert.equal(first?.compEndsAt, "2026-12-08T01:04:51.000Z", "the confirmed end date comes with the claim")
  assert.equal(await claimCancelNotice(table, EMAIL), null, "second claim refused")
  assert.equal((await readState(table, EMAIL))?.compCancelNotifiedAt, "2026-11-12T15:01:00.000Z")
})

test("cancellation notice: not claimable while Stripe hasn't confirmed; the retry finishes and claims it once", async () => {
  const { d, table, stripe } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  stripe.failNext = "timeout-after"
  const pending = await clientCancelComplimentary(d, { email: EMAIL })
  assert.ok(!pending.ok && pending.uncertain)
  assert.equal(await claimCancelNotice(table, EMAIL), null, "nothing to send while unconfirmed")
  // The client's "check again" calls the cancellation again: it reconciles from Stripe and reports the confirmed date.
  const again = await clientCancelComplimentary(d, { email: EMAIL })
  assert.ok(again.ok && again.effectiveDate === "2026-12-08T01:04:51.000Z", JSON.stringify(again))
  assert.ok(await claimCancelNotice(table, EMAIL), "now claimable, once")
  assert.equal(await claimCancelNotice(table, EMAIL), null)
})

test("cancellation notice: a failed email releases the claim so a retry can send it", async () => {
  const { d, table } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm, reason: REASON })
  await clientCancelComplimentary(d, { email: EMAIL })
  assert.ok(await claimCancelNotice(table, EMAIL))
  await releaseCancelNotice(table, EMAIL)
  assert.ok(await claimCancelNotice(table, EMAIL), "claimable again after release")
})
