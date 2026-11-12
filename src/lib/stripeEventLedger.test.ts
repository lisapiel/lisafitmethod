import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { FakeTable } from "./testing/fakeDynamo"
import {
  LEASE_MS, claimEvent, completeEvent, ledgerKey, runEventOnce, sendOncePerEvent, type LedgerDb, type LedgerFailure,
} from "./stripeEventLedger"
import { invoiceSubscriptionId, isStaleCancellation, subscriptionEndedAt } from "./stripeWebhookFields"
import { sendOrThrow, type EmailSender } from "./sendOrThrow"
import { revokeEntitlement, type AuditDb } from "./entitlementAudit"
import { releaseBundleCreditForSession, type WebhookStripe } from "./bundleCreditWebhook"
import type { CreditDb } from "./bundleCreditStore"

const EVT = { id: "evt_test_1", type: "invoice.paid" }
const ok = () => Promise.resolve(Response.json({ received: true }))
const fail = () => Promise.resolve(Response.json({ error: "boom" }, { status: 500 }))

let table: FakeTable
let db: LedgerDb
let clock: number
const now = () => clock
const opts = () => ({ db, now, retryDelayMs: 0 })

beforeEach(() => {
  table = new FakeTable()
  db = table as unknown as LedgerDb
  clock = 1_800_000_000_000
})

// Passes the first `passes` calls to the fake table, then fails every PutCommand.
function failPutsAfter(passes: number, failures = Infinity): LedgerDb {
  let calls = 0
  let failed = 0
  return {
    send: async (cmd) => {
      calls += 1
      const isPut = cmd.constructor.name === "PutCommand"
      if (calls > passes && isPut && failed < failures) {
        failed += 1
        throw new Error("write failed")
      }
      return table.send(cmd) as Promise<{ Item?: Record<string, unknown> }>
    },
  }
}

function sender(log: string[], failSubjects: Set<string> = new Set()): EmailSender {
  return {
    emails: {
      send: async (payload) => {
        const subject = String(payload.subject)
        if (failSubjects.has(subject)) return { error: { message: "provider down" } }
        log.push(subject)
        return { error: null }
      },
    },
  }
}
const mail = (subject: string) => ({ from: "noreply@x.test", to: "client@x.test", subject, html: "<p>hi</p>" })

describe("duplicate deliveries", () => {
  test("a repeat of a handled event is acknowledged without running the handler again", async () => {
    let runs = 0
    const handle = async () => { runs += 1; return ok() }
    const first = await runEventOnce(EVT, handle, opts())
    const second = await runEventOnce(EVT, handle, opts())
    assert.equal(first.status, 200)
    assert.equal(second.status, 200)
    assert.deepEqual(await second.json(), { received: true, duplicate: true })
    assert.equal(runs, 1)
    assert.equal(table.items.get(ledgerKey(EVT.id))?.status, "done")
  })

  test("different events are each handled once", async () => {
    let runs = 0
    const handle = async () => { runs += 1; return ok() }
    await runEventOnce({ id: "evt_a", type: "invoice.paid" }, handle, opts())
    await runEventOnce({ id: "evt_b", type: "invoice.paid" }, handle, opts())
    assert.equal(runs, 2)
  })

  test("the ledger stores only the event id, type and state", async () => {
    await runEventOnce(EVT, ok, opts())
    const keys = Object.keys(table.items.get(ledgerKey(EVT.id)) ?? {}).sort()
    assert.deepEqual(keys, ["eventId", "eventType", "processedAt", "status", "token", "userId"])
  })
})

describe("retries after failure", () => {
  test("a failed event is released so Stripe's retry runs it in full", async () => {
    let runs = 0
    const first = await runEventOnce(EVT, async () => { runs += 1; return fail() }, opts())
    assert.equal(first.status, 500)
    assert.equal(table.items.has(ledgerKey(EVT.id)), false)
    const retry = await runEventOnce(EVT, async () => { runs += 1; return ok() }, opts())
    assert.equal(retry.status, 200)
    assert.equal(runs, 2)
    assert.equal(table.items.get(ledgerKey(EVT.id))?.status, "done")
  })

  test("a handler that throws becomes a retryable 500 and is released", async () => {
    const res = await runEventOnce(EVT, async () => { throw new Error("DynamoDB unavailable") }, opts())
    assert.equal(res.status, 500)
    assert.equal(table.items.has(ledgerKey(EVT.id)), false)
  })

  test("4xx answers from the handler are not recorded as done", async () => {
    await runEventOnce(EVT, () => Promise.resolve(Response.json({}, { status: 400 })), opts())
    assert.equal(table.items.has(ledgerKey(EVT.id)), false)
  })

  test("if releasing a failed event also fails, the 500 still goes back and the lease lets the retry run", async () => {
    const broken: LedgerDb = {
      send: async (cmd) => {
        if (cmd.constructor.name === "DeleteCommand") throw new Error("delete failed")
        return table.send(cmd) as Promise<{ Item?: Record<string, unknown> }>
      },
    }
    const res = await runEventOnce(EVT, fail, { db: broken, now, retryDelayMs: 0 })
    assert.equal(res.status, 500)
    clock += LEASE_MS + 1
    let runs = 0
    const retry = await runEventOnce(EVT, async () => { runs += 1; return ok() }, opts())
    assert.equal(retry.status, 200)
    assert.equal(runs, 1)
  })
})

describe("partial failures: emails are sent at most once per event", () => {
  test("a retry skips the email an earlier attempt already sent and sends the one that failed", async () => {
    const sent: string[] = []
    const failing = new Set(["Second email"])
    const handle = async () => {
      await sendOrThrow(sender(sent, failing), mail("First email"))
      await sendOrThrow(sender(sent, failing), mail("Second email"))
      return ok()
    }
    const first = await runEventOnce(EVT, handle, opts())
    assert.equal(first.status, 500)
    assert.deepEqual(sent, ["First email"])
    failing.clear()
    const retry = await runEventOnce(EVT, handle, opts())
    assert.equal(retry.status, 200)
    assert.deepEqual(sent, ["First email", "Second email"])
  })

  test("the same email in a different event is sent again (it is a different business event)", async () => {
    const sent: string[] = []
    const handle = async () => { await sendOrThrow(sender(sent), mail("Receipt")); return ok() }
    await runEventOnce({ id: "evt_x", type: "invoice.paid" }, handle, opts())
    await runEventOnce({ id: "evt_y", type: "invoice.paid" }, handle, opts())
    assert.deepEqual(sent, ["Receipt", "Receipt"])
  })

  test("a failed send leaves no marker, so the retry sends it", async () => {
    const sent: string[] = []
    const failing = new Set(["Welcome"])
    const handle = async () => { await sendOrThrow(sender(sent, failing), mail("Welcome")); return ok() }
    await runEventOnce(EVT, handle, opts())
    assert.equal([...table.items.keys()].some((k) => k.includes("__mail_")), false)
    failing.clear()
    await runEventOnce(EVT, handle, opts())
    assert.deepEqual(sent, ["Welcome"])
  })

  test("email markers hold a hash, never the address or subject", async () => {
    await runEventOnce(EVT, async () => { await sendOrThrow(sender([]), mail("Welcome")); return ok() }, opts())
    const markers = [...table.items.entries()].filter(([k]) => k.includes("__mail_"))
    assert.equal(markers.length, 1)
    const text = JSON.stringify(markers)
    assert.equal(text.includes("client@x.test"), false)
    assert.equal(text.includes("Welcome"), false)
  })

  test("outside a webhook event, emails are simply sent", async () => {
    let sent = 0
    assert.equal(await sendOncePerEvent("a@x.test", "Hi", async () => { sent += 1 }), "sent")
    assert.equal(await sendOncePerEvent("a@x.test", "Hi", async () => { sent += 1 }), "sent")
    assert.equal(sent, 2)
  })
})

describe("recording done fails after successful work (concern 1)", () => {
  test("a transient failure is retried, and the event ends up recorded as done", async () => {
    const alerts: LedgerFailure[] = []
    const flaky = failPutsAfter(1, 1)
    const res = await runEventOnce(EVT, ok, { db: flaky, now, retryDelayMs: 0, onLedgerFailure: (f) => { alerts.push(f) } })
    assert.equal(res.status, 200)
    assert.equal(table.items.get(ledgerKey(EVT.id))?.status, "done")
    assert.equal(alerts.length, 0)
  })

  test("a persistent failure still answers 200, alerts once, and does not run the work twice", async () => {
    const alerts: LedgerFailure[] = []
    let runs = 0
    const sent: string[] = []
    const handle = async () => { runs += 1; await sendOrThrow(sender(sent), mail("Welcome")); return ok() }
    const broken = failPutsAfter(1)
    const res = await runEventOnce(EVT, handle, { db: broken, now, retryDelayMs: 0, onLedgerFailure: (f) => { alerts.push(f) } })
    assert.equal(res.status, 200, "answering 500 would make Stripe repeat completed work")
    assert.equal(runs, 1)
    assert.equal(alerts.length, 1)
    assert.equal(alerts[0].eventId, EVT.id)
    assert.equal(table.items.get(ledgerKey(EVT.id))?.status, "processing")

    // Stripe does not resend a 200. Only an unusual duplicate delivery could
    // arrive; within the lease it is held off.
    const duplicateSoon = await runEventOnce(EVT, handle, opts())
    assert.equal(duplicateSoon.status, 409)
    assert.equal(runs, 1)
  })

  test("in the rare duplicate after the lease, the work re-runs but its emails are not repeated", async () => {
    const sent: string[] = []
    let runs = 0
    const handle = async () => { runs += 1; await sendOrThrow(sender(sent), mail("Welcome")); return ok() }
    // The email marker write succeeds (call 3); every later Put, including all "done" attempts, fails.
    await runEventOnce(EVT, handle, { db: failPutsAfter(3), now, retryDelayMs: 0 })
    clock += LEASE_MS + 1
    const late = await runEventOnce(EVT, handle, opts())
    assert.equal(late.status, 200)
    assert.equal(runs, 2, "documented residual: business steps must be idempotent (see proposal section 3)")
    assert.deepEqual(sent, ["Welcome"])
  })

  test("if another run took the event over, its result is left alone", async () => {
    const stale = await claimEvent(EVT.id, EVT.type, db, clock)
    assert.equal(stale.kind, "claimed")
    clock += LEASE_MS + 1
    const fresh = await claimEvent(EVT.id, EVT.type, db, clock)
    assert.equal(fresh.kind, "claimed")
    await assert.rejects(completeEvent(stale as Extract<typeof stale, { kind: "claimed" }>, EVT.type, db, clock))
    assert.equal(table.items.get(ledgerKey(EVT.id))?.status, "processing")
  })
})

describe("concurrent and crashed runs", () => {
  test("a second delivery while the first is still running gets 409 so Stripe retries later", async () => {
    await claimEvent(EVT.id, EVT.type, db, clock)
    let runs = 0
    const res = await runEventOnce(EVT, async () => { runs += 1; return ok() }, opts())
    assert.equal(res.status, 409)
    assert.equal(runs, 0)
  })

  test("a run that crashed is taken over once its lease has expired", async () => {
    await claimEvent(EVT.id, EVT.type, db, clock)
    clock += LEASE_MS + 1
    let runs = 0
    const res = await runEventOnce(EVT, async () => { runs += 1; return ok() }, opts())
    assert.equal(res.status, 200)
    assert.equal(runs, 1)
  })
})

describe("ledger outages", () => {
  test("if the ledger can't be reached, nothing runs and Stripe is asked to retry", async () => {
    const broken: LedgerDb = { send: async () => { throw new Error("network down") } }
    let runs = 0
    const res = await runEventOnce(EVT, async () => { runs += 1; return ok() }, { db: broken, now })
    assert.equal(res.status, 503)
    assert.equal(runs, 0)
  })
})

describe("repeat-safe business steps", () => {
  test("a repeated refund revocation keeps the first audit record", async () => {
    const auditDb = table as unknown as AuditDb
    table.put({ userId: "training_access_client@x.test", grantedAt: "2026-06-01T00:00:00.000Z", grantType: "purchase" })
    const input = { email: "client@x.test", entitlement: "training" as const, reason: "refunded", stripeId: "ch_1" }
    await revokeEntitlement({ ...input, previous: { grantedAt: "2026-06-01T00:00:00.000Z", grantType: "purchase" } }, auditDb)
    await revokeEntitlement({ ...input, previous: null }, auditDb)
    const audit = table.items.get("entitlement_audit_ch_1_training")
    assert.equal(audit?.previousGrantedAt, "2026-06-01T00:00:00.000Z")
    assert.equal(audit?.previousGrantType, "purchase")
    assert.equal(table.items.has("training_access_client@x.test"), false)
  })

  test("an expired checkout whose coupon lookup fails is retried, not silently kept on hold", async () => {
    const stripe: WebhookStripe = {
      invoices: { retrieve: async () => ({}) },
      paymentIntents: { retrieve: async () => ({}) },
      coupons: { retrieve: async () => { throw Object.assign(new Error("connection reset"), { code: "ECONNRESET" }) } },
    }
    await assert.rejects(releaseBundleCreditForSession(stripe, { discounts: [{ coupon: "co_1" }] }, table as unknown as CreditDb))
  })

  test("an expired checkout whose coupon no longer exists has nothing to release", async () => {
    const stripe: WebhookStripe = {
      invoices: { retrieve: async () => ({}) },
      paymentIntents: { retrieve: async () => ({}) },
      coupons: { retrieve: async () => { throw Object.assign(new Error("No such coupon"), { code: "resource_missing" }) } },
    }
    assert.equal(await releaseBundleCreditForSession(stripe, { discounts: [{ coupon: "co_1" }] }, table as unknown as CreditDb), false)
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
  test("a Resend error result becomes a thrown error", async () => {
    const s: EmailSender = { emails: { send: async () => ({ error: { message: "domain not verified", name: "validation_error" } }) } }
    await assert.rejects(sendOrThrow(s, mail("Hello")), /Email not sent \(Hello\): domain not verified/)
  })

  test("a successful send does not throw, and the error never includes the recipient", async () => {
    await sendOrThrow({ emails: { send: async () => ({ error: null }) } }, mail("Hello"))
    const failing: EmailSender = { emails: { send: async () => ({ error: { message: "rate limited" } }) } }
    await assert.rejects(sendOrThrow(failing, mail("Hello")), (err: Error) => !err.message.includes("client@x.test"))
  })
})
