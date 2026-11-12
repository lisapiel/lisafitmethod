import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { FakeTable } from "./testing/fakeDynamo"
import { LEASE_MS, claimEvent, ledgerKey, runEventOnce, type LedgerDb } from "./stripeEventLedger"
import { invoiceSubscriptionId, isStaleCancellation, subscriptionEndedAt } from "./stripeWebhookFields"
import { sendOrThrow, type EmailSender } from "./sendOrThrow"

const EVT = { id: "evt_test_1", type: "invoice.paid" }
const ok = () => Promise.resolve(Response.json({ received: true }))
const fail = () => Promise.resolve(Response.json({ error: "boom" }, { status: 500 }))

let table: FakeTable
let db: LedgerDb
let clock: number
const now = () => clock

beforeEach(() => {
  table = new FakeTable()
  db = table as unknown as LedgerDb
  clock = 1_800_000_000_000
})

describe("duplicate deliveries", () => {
  test("a repeat of a handled event is acknowledged without running the handler again", async () => {
    let runs = 0
    const handle = async () => { runs += 1; return ok() }
    const first = await runEventOnce(EVT, handle, db, now)
    const second = await runEventOnce(EVT, handle, db, now)
    assert.equal(first.status, 200)
    assert.equal(second.status, 200)
    assert.deepEqual(await second.json(), { received: true, duplicate: true })
    assert.equal(runs, 1)
    assert.equal(table.items.get(ledgerKey(EVT.id))?.status, "done")
  })

  test("different events are each handled once", async () => {
    let runs = 0
    const handle = async () => { runs += 1; return ok() }
    await runEventOnce({ id: "evt_a", type: "invoice.paid" }, handle, db, now)
    await runEventOnce({ id: "evt_b", type: "invoice.paid" }, handle, db, now)
    assert.equal(runs, 2)
  })

  test("the ledger stores only the event id, type and state", async () => {
    await runEventOnce(EVT, ok, db, now)
    const keys = Object.keys(table.items.get(ledgerKey(EVT.id)) ?? {}).sort()
    assert.deepEqual(keys, ["eventId", "eventType", "processedAt", "status", "token", "userId"])
  })
})

describe("retries after failure", () => {
  test("a failed event is released so Stripe's retry runs it in full", async () => {
    let runs = 0
    const first = await runEventOnce(EVT, async () => { runs += 1; return fail() }, db, now)
    assert.equal(first.status, 500)
    assert.equal(table.items.has(ledgerKey(EVT.id)), false)
    const retry = await runEventOnce(EVT, async () => { runs += 1; return ok() }, db, now)
    assert.equal(retry.status, 200)
    assert.equal(runs, 2)
    assert.equal(table.items.get(ledgerKey(EVT.id))?.status, "done")
  })

  test("a handler that throws becomes a retryable 500 and is released", async () => {
    const res = await runEventOnce(EVT, async () => { throw new Error("DynamoDB unavailable") }, db, now)
    assert.equal(res.status, 500)
    assert.equal(table.items.has(ledgerKey(EVT.id)), false)
  })

  test("a partial failure (first step done, second failed) runs both steps again on retry", async () => {
    const steps: string[] = []
    let failSecond = true
    const handle = async () => {
      steps.push("provision")
      if (failSecond) return fail()
      steps.push("mark-paid")
      return ok()
    }
    await runEventOnce(EVT, handle, db, now)
    failSecond = false
    await runEventOnce(EVT, handle, db, now)
    assert.deepEqual(steps, ["provision", "provision", "mark-paid"])
  })

  test("4xx answers from the handler are not recorded as done", async () => {
    await runEventOnce(EVT, () => Promise.resolve(Response.json({}, { status: 400 })), db, now)
    assert.equal(table.items.has(ledgerKey(EVT.id)), false)
  })
})

describe("concurrent and crashed runs", () => {
  test("a second delivery while the first is still running gets 409 so Stripe retries later", async () => {
    const claim = await claimEvent(EVT.id, EVT.type, db, clock)
    assert.equal(claim.kind, "claimed")
    let runs = 0
    const res = await runEventOnce(EVT, async () => { runs += 1; return ok() }, db, now)
    assert.equal(res.status, 409)
    assert.equal(runs, 0)
  })

  test("a run that crashed is taken over once its lease has expired", async () => {
    await claimEvent(EVT.id, EVT.type, db, clock)
    clock += LEASE_MS + 1
    let runs = 0
    const res = await runEventOnce(EVT, async () => { runs += 1; return ok() }, db, now)
    assert.equal(res.status, 200)
    assert.equal(runs, 1)
  })

  test("a late finish from a run that lost its lease cannot overwrite the new run", async () => {
    const stale = await claimEvent(EVT.id, EVT.type, db, clock)
    assert.equal(stale.kind, "claimed")
    clock += LEASE_MS + 1
    const fresh = await claimEvent(EVT.id, EVT.type, db, clock)
    assert.equal(fresh.kind, "claimed")
    const { completeEvent } = await import("./stripeEventLedger")
    await assert.rejects(completeEvent(stale as Extract<typeof stale, { kind: "claimed" }>, EVT.type, db, clock))
    assert.equal(table.items.get(ledgerKey(EVT.id))?.status, "processing")
  })
})

describe("ledger outages", () => {
  test("if the ledger can't be reached, nothing runs and Stripe is asked to retry", async () => {
    const broken: LedgerDb = { send: async () => { throw new Error("network down") } }
    let runs = 0
    const res = await runEventOnce(EVT, async () => { runs += 1; return ok() }, broken, now)
    assert.equal(res.status, 503)
    assert.equal(runs, 0)
  })

  test("if marking done fails after success, the success response still goes back", async () => {
    let calls = 0
    const flaky: LedgerDb = {
      send: async (cmd) => {
        calls += 1
        if (calls === 1) return table.send(cmd) as Promise<{ Item?: Record<string, unknown> }>
        throw new Error("write failed")
      },
    }
    const res = await runEventOnce(EVT, ok, flaky, now)
    assert.equal(res.status, 200)
  })
})

describe("cancellation helpers", () => {
  test("the effective date is when the subscription ended, not when the event arrived", () => {
    assert.equal(subscriptionEndedAt({ ended_at: 1_700_000_000, canceled_at: 1_690_000_000 }, 1_800_000_000), new Date(1_700_000_000_000).toISOString())
    assert.equal(subscriptionEndedAt({ ended_at: null, canceled_at: 1_690_000_000 }, 1_800_000_000), new Date(1_690_000_000_000).toISOString())
    assert.equal(subscriptionEndedAt({}, 1_800_000_000), new Date(1_800_000_000_000).toISOString())
  })

  test("a cancellation for an older subscription is stale; for the current one, or none on file, it is not", () => {
    assert.equal(isStaleCancellation("sub_new", "sub_old"), true)
    assert.equal(isStaleCancellation("sub_same", "sub_same"), false)
    assert.equal(isStaleCancellation(undefined, "sub_old"), false)
    assert.equal(isStaleCancellation("", "sub_old"), false)
  })
})

describe("invoice subscription lookup", () => {
  test("finds the subscription in every place Stripe has put it", () => {
    assert.equal(invoiceSubscriptionId({ subscription: "sub_1" }), "sub_1")
    assert.equal(invoiceSubscriptionId({ subscription: { id: "sub_2" } }), "sub_2")
    assert.equal(invoiceSubscriptionId({ parent: { subscription_details: { subscription: "sub_3" } } }), "sub_3")
    assert.equal(invoiceSubscriptionId({ parent: { subscription_details: { subscription: { id: "sub_4" } } } }), "sub_4")
    assert.equal(invoiceSubscriptionId({ lines: { data: [{}, { subscription: "sub_5" }] } }), "sub_5")
    assert.equal(invoiceSubscriptionId({}), "")
  })
})

describe("email sending", () => {
  const payload = { from: "a@x.test", to: "b@x.test", subject: "Hello", html: "<p>hi</p>" }

  test("a Resend error result becomes a thrown error", async () => {
    const sender: EmailSender = { emails: { send: async () => ({ error: { message: "domain not verified", name: "validation_error" } }) } }
    await assert.rejects(sendOrThrow(sender, payload), /Email not sent \(Hello\): domain not verified/)
  })

  test("a successful send does not throw, and the error never includes the recipient", async () => {
    const sender: EmailSender = { emails: { send: async () => ({ error: null }) } }
    await sendOrThrow(sender, payload)
    const failing: EmailSender = { emails: { send: async () => ({ error: { message: "rate limited" } }) } }
    await assert.rejects(sendOrThrow(failing, payload), (err: Error) => !err.message.includes("b@x.test"))
  })
})
