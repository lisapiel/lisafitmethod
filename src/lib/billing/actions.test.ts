import { test } from "node:test"
import assert from "node:assert/strict"
import { FakeTable } from "@/lib/testing/fakeDynamo"
import { makeComplimentary, voidOutstandingInvoice, recordPaid, reconcile, manageView, SETTLE_AFTER_MS, type Deps } from "./actions"
import { readState, readOp, listOps } from "./store"
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
          })
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

test("Make Complimentary: pauses collection with void, records it, leaves access alone", async () => {
  const { d, stripe, table } = setup()
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
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
  assert.deepEqual(ops[0].before, { mode: "paid", collectingCents: 100 })
  assert.ok(![...table.items.keys()].some((k) => k.startsWith("coaching_access_")), "no access record was written")
})

test("a stale confirmation changes nothing and calls nothing", async () => {
  const { d, stripe, table } = setup()
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: "sub_other" } })
  assert.equal(r.ok, false)
  assert.equal(stripe.writes.length, 0)
  assert.equal(await readState(table, EMAIL), null)
})

test("blocked plans change nothing", async () => {
  const { d, stripe } = setup()
  stripe.subs.get("sub_1")!.cancel_at_period_end = true
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
  assert.ok(!r.ok && r.status === 409 && r.blockers?.[0].code === "cancellation-scheduled")
  assert.equal(stripe.writes.length, 0)
})

test("Stripe refuses: nothing changes here, the failure is recorded, the lock is released", async () => {
  const { d, stripe, table } = setup()
  stripe.failNext = "definitive"
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
  assert.ok(!r.ok && r.status === 502 && !r.uncertain)
  const state = await readState(table, EMAIL)
  assert.equal(state?.mode, "paid")
  assert.equal(state?.pendingOpId, null)
  const [op] = await listOps(table, EMAIL)
  assert.equal(op.status, "FAILED")
  assert.match(op.error ?? "", /declined/)
  // and a retry works
  const again = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
  assert.equal(again.ok, true)
})

test("no answer from Stripe, and it never applied: stays locked, guard protects access, closed as failed later", async () => {
  const { d, stripe, table, advance } = setup()
  stripe.failNext = "timeout-before"
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
  assert.ok(!r.ok && r.uncertain)
  const locked = await readState(table, EMAIL)
  assert.equal(locked?.pendingKind, "MAKE_COMPLIMENTARY")
  assert.equal(locked?.pendingStatus, "UNCERTAIN")
  // While uncertain, a deletion can't end their coaching.
  const decision = decideOnSubscriptionDeleted({
    deleted: { id: "sub_1", pause: null, metadata: { product: "coaching" }, cancellationReason: "payment_failed", cancelAtPeriodEnd: false, cancelAt: null },
    client: { stripeSubscriptionId: "sub_1" },
    billing: { mode: locked!.mode, pendingKind: locked!.pendingKind, pendingStatus: locked!.pendingStatus },
  })
  assert.equal(decision.action, "keep")
  // A second change is refused while this is unsettled.
  const busy = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
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
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
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
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
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
    makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm }),
    makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm }),
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
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: null } })
  assert.equal(r.ok, true, JSON.stringify(r))
  assert.equal(stripe.writes.length, 0)
  assert.equal((await readState(table, EMAIL))?.mode, "complimentary")
})

test("client with no subscription: recorded as complimentary without Stripe", async () => {
  const { d, stripe, table } = setup({ client: { stripeSubscriptionId: null } })
  stripe.subs.clear()
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm: { subscriptionId: null } })
  assert.equal(r.ok, true)
  assert.equal((await readState(table, EMAIL))?.mode, "complimentary")
})

test("outstanding invoices are shown, never voided by Make Complimentary, and voided only on request", async () => {
  const { d, stripe, table } = setup()
  stripe.invoices.set("in_open", { id: "in_open", number: "A-2", status: "open", amount_due: 100, amount_paid: 0, amount_remaining: 100, created: 1765156000, parent: { subscription_details: { subscription: "sub_1" } } })
  const before = await manageView(d, EMAIL)
  assert.deepEqual(before.outstanding.map((i) => i.id), ["in_open"])
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
  assert.equal(stripe.invoices.get("in_open")!.status, "open", "not voided automatically")

  const wrong = await voidOutstandingInvoice(d, { email: EMAIL, admin: ADMIN, invoiceId: "in_open", confirmAmountCents: 999 })
  assert.ok(!wrong.ok)
  const paid = await voidOutstandingInvoice(d, { email: EMAIL, admin: ADMIN, invoiceId: "in_paid", confirmAmountCents: 0 })
  assert.ok(!paid.ok && /never refunds/.test(paid.message))
  const r = await voidOutstandingInvoice(d, { email: EMAIL, admin: ADMIN, invoiceId: "in_open", confirmAmountCents: 100 })
  assert.equal(r.ok, true, JSON.stringify(r))
  assert.equal(stripe.invoices.get("in_open")!.status, "void")
  assert.equal(stripe.invoices.get("in_paid")!.status, "paid")
  assert.equal((await readState(table, EMAIL))?.mode, "complimentary", "voiding doesn't change the mode")
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
  const { d, table } = setup({ client: { stripeSubscriptionId: "sub_1", accessType: "complimentary" } })
  const view = await manageView(d, EMAIL)
  assert.equal(view.mode, "complimentary")
  assert.equal(view.collection.state, "out-of-sync-collecting")
  const r = await recordPaid(d, { email: EMAIL, admin: ADMIN })
  assert.equal(r.ok, true)
  assert.equal((await readState(table, EMAIL))?.mode, "paid")
})

test("record as paid is refused while Stripe isn't collecting", async () => {
  const { d } = setup()
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
  const r = await recordPaid(d, { email: EMAIL, admin: ADMIN })
  assert.ok(!r.ok && /Resume Paid Coaching/.test(r.message))
})

test("the management view: paid client shows Stripe's next charge; complimentary shows none", async () => {
  const { d, stripe } = setup()
  const paid = await manageView(d, EMAIL)
  assert.equal(paid.collection.state, "paid")
  assert.equal(paid.collection.nextCollection?.amountCents, 100)
  assert.equal(paid.complimentary.kind, "pause")
  await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
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
  const r = await makeComplimentary(d, { email: EMAIL, admin: ADMIN, confirm })
  const op = await readOp(table, (r as { opId: string }).opId)
  assert.equal(op?.status, "COMPLETED")
  assert.equal(op?.opRev, 2)
})
