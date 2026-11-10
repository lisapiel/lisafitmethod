import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { FakeTable } from "./testing/fakeDynamo"
import {
  parseBundlePurchase, readBundlePurchase, recordBundlePayment, recordBundleRefund, reserveBundleCredit,
  saveBundleCreditChoice, type CreditDb,
} from "./bundleCreditStore"
import { reserveCreditForCheckout, assessBundleCredit, creditApplicationOf, type CouponCreator } from "./bundleCreditAssess"
import { verifyBundlePayment, bundleCreditDiscountOnInvoice, readCoachingHistory, type StripeReader } from "./bundleCreditStripe"
import {
  recordBundlePaymentFromIntent, releaseBundleCreditForSession, settleBundleCreditFromInvoice, syncBundleCreditFromCharge,
  type WebhookStripe,
} from "./bundleCreditWebhook"
import type { CoachingApplication } from "./authTokens"

// Runs the store, checkout and webhook pieces against an in-memory table and
// a stubbed Stripe. Nothing leaves the process.

const BUYER = "buyer@example.test"
const PURCHASED = "2026-11-01T15:00:00.000Z"
const NOW = "2026-11-05T15:00:00.000Z"

let table: FakeTable
let db: CreditDb

beforeEach(() => {
  table = new FakeTable(50)
  db = { send: async (c) => (await table.send(c)) as { Item?: Record<string, unknown> } }
})

type Call = { method: string; args: unknown[] }

function stubStripe(over: {
  intent?: unknown
  intentThrows?: boolean
  disputes?: unknown[]
  customers?: Record<string, string[]>
  subscriptions?: Record<string, unknown[]>
  invoices?: Record<string, unknown[]>
  historyThrows?: boolean
  couponThrows?: boolean
} = {}) {
  const calls: Call[] = []
  let couponN = 0
  const log = (method: string, ...args: unknown[]) => calls.push({ method, args })
  const stripe: StripeReader & CouponCreator = {
    paymentIntents: {
      retrieve: async (...args) => {
        log("paymentIntents.retrieve", ...args)
        if (over.intentThrows) throw new Error("network")
        return over.intent
      },
    },
    disputes: { list: async (...args) => { log("disputes.list", ...args); return { data: over.disputes ?? [] } } },
    customers: {
      list: async (p) => {
        log("customers.list", p)
        if (over.historyThrows) throw new Error("network")
        return { data: (over.customers?.[p.email] ?? []).map((id) => ({ id })) }
      },
    },
    subscriptions: { list: async (p) => { log("subscriptions.list", p); return { data: over.subscriptions?.[p.customer] ?? [] } } },
    invoices: { list: async (p) => { log("invoices.list", p); return { data: over.invoices?.[p.subscription] ?? [] } } },
    coupons: {
      create: async (p) => {
        log("coupons.create", p)
        if (over.couponThrows) throw new Error("stripe down")
        couponN += 1
        return { id: `coupon_${couponN}` }
      },
    },
  }
  return { stripe, calls }
}

const readClient = async () => null

function application(id: string, over: Partial<CoachingApplication> = {}): CoachingApplication {
  return {
    userId: `coaching_app_${id}`, id, email: BUYER, name: "Buyer", goals: "", currentFitnessLevel: "", whyCoaching: "",
    status: "APPROVED", applicationDate: "2026-11-03T15:00:00.000Z", approvedPriceInCents: 39700,
    approvedCommitmentType: "THREE_MONTH_MINIMUM", ...over,
  }
}

async function seedPurchase(amountPaidCents = 13700) {
  await recordBundlePayment({ email: BUYER, paymentIntentId: "pi_bundle", purchasedAt: PURCHASED, amountPaidCents, currency: "usd" }, db)
}

describe("purchase records", () => {
  test("the bundle webhook records amount, currency, PaymentIntent and time", async () => {
    await recordBundlePaymentFromIntent({
      id: "pi_bundle", amount_received: 6850, currency: "usd", created: Date.parse(PURCHASED) / 1000,
      metadata: { product: "bundle", customerEmail: "Buyer@Example.test" },
    }, db)
    const r = await readBundlePurchase(BUYER, db)
    assert.equal(r?.amountPaidCents, 6850)
    assert.equal(r?.currency, "usd")
    assert.equal(r?.paymentIntentId, "pi_bundle")
    assert.equal(r?.purchasedAt, PURCHASED)
  })
  test("other products never create a bundle record", async () => {
    await recordBundlePaymentFromIntent({ id: "pi_t", amount_received: 9700, currency: "usd", created: 1, metadata: { product: "training", customerEmail: BUYER } }, db)
    assert.equal(await readBundlePurchase(BUYER, db), null)
  })
  test("old fake 'credit used' records without a payment are not purchases", () => {
    assert.equal(parseBundlePurchase({ userId: `bundle_purchase_${BUYER}`, bundleCreditUsedAt: NOW, usedForCoachingSubscriptionId: "sub_1" }), null)
    assert.equal(parseBundlePurchase({ email: BUYER, purchasedAt: "nope", paymentIntentId: "pi_1" }), null)
  })
  test("holds, refunds and use never create a record for someone who didn't buy", async () => {
    assert.equal(await reserveBundleCredit({ email: BUYER, applicationId: "a", until: NOW, now: NOW }, db), false)
    assert.equal(await recordBundleRefund({ email: BUYER, paymentIntentId: "pi_x", refundedCents: 100 }, db), false)
    const stripe = invoiceStripe({ email: BUYER, amount: 13700 })
    const settled = await settleBundleCreditFromInvoice(stripe, "in_1", db)
    assert.equal(settled.outcome, "no-record")
    assert.equal(table.items.size, 0)
  })
  test("a fake record left by the old code is replaced by a real purchase", async () => {
    table.put({ userId: `bundle_purchase_${BUYER}`, bundleCreditUsedAt: NOW })
    await seedPurchase()
    const r = await readBundlePurchase(BUYER, db)
    assert.equal(r?.amountPaidCents, 13700)
    assert.equal(r?.usage.usedAt, null)
  })
  test("a second purchase only replaces a first that was fully refunded", async () => {
    await seedPurchase()
    await recordBundlePayment({ email: BUYER, paymentIntentId: "pi_2", purchasedAt: NOW, amountPaidCents: 6850, currency: "usd" }, db)
    assert.equal((await readBundlePurchase(BUYER, db))?.paymentIntentId, "pi_bundle")
    await recordBundleRefund({ email: BUYER, paymentIntentId: "pi_bundle", refundedCents: 13700 }, db)
    await recordBundlePayment({ email: BUYER, paymentIntentId: "pi_2", purchasedAt: NOW, amountPaidCents: 6850, currency: "usd" }, db)
    assert.equal((await readBundlePurchase(BUYER, db))?.paymentIntentId, "pi_2")
  })
})

describe("refunds and disputes", () => {
  function chargeStripe(product = "bundle"): WebhookStripe {
    return {
      invoices: { retrieve: async () => null },
      paymentIntents: { retrieve: async () => ({ id: "pi_bundle", metadata: { product, customerEmail: BUYER } }) },
      coupons: { retrieve: async () => null },
    }
  }
  test("partial then full refunds lower the credit, and replays never raise it", async () => {
    await seedPurchase()
    await syncBundleCreditFromCharge(chargeStripe(), { payment_intent: "pi_bundle", amount_refunded: 5000 }, {}, db)
    let check = await verifyBundlePayment(await readBundlePurchase(BUYER, db), null)
    assert.equal(check.state === "verified" && check.payment.refundedCents, 5000)
    await syncBundleCreditFromCharge(chargeStripe(), { payment_intent: "pi_bundle", amount_refunded: 13700 }, {}, db)
    await syncBundleCreditFromCharge(chargeStripe(), { payment_intent: "pi_bundle", amount_refunded: 5000 }, {}, db)
    check = await verifyBundlePayment(await readBundlePurchase(BUYER, db), null)
    assert.equal(check.state === "verified" && check.payment.refundedCents, 13700)
  })
  test("a lost dispute zeroes the credit; an open one blocks it until closed", async () => {
    await seedPurchase()
    await syncBundleCreditFromCharge(chargeStripe(), { payment_intent: "pi_bundle", amount_refunded: 0 }, { dispute: "open" }, db)
    assert.equal((await readBundlePurchase(BUYER, db))?.dispute, "open")
    await syncBundleCreditFromCharge(chargeStripe(), { payment_intent: "pi_bundle" }, { dispute: "closed" }, db)
    assert.equal((await readBundlePurchase(BUYER, db))?.dispute, "none")
    await syncBundleCreditFromCharge(chargeStripe(), { payment_intent: "pi_bundle" }, { dispute: "lost" }, db)
    const a = await assessBundleCredit({ stripe: null, db, readClient }, { application: creditApplicationOf(application("a1")), commitmentType: "THREE_MONTH_MINIMUM", priceCents: 39700, now: NOW })
    assert.equal(a.plan.netPaidCents, 0)
    assert.deepEqual(a.plan.blocks, ["refunded"])
  })
  test("refunds on other products leave the bundle record alone", async () => {
    await seedPurchase()
    await syncBundleCreditFromCharge(chargeStripe("training"), { payment_intent: "pi_bundle", amount_refunded: 9700 }, {}, db)
    assert.equal((await readBundlePurchase(BUYER, db))?.refundedCents, 0)
  })
})

describe("older records without an amount", () => {
  function legacy() {
    table.put({ userId: `bundle_purchase_${BUYER}`, email: BUYER, purchasedAt: PURCHASED, paymentIntentId: "pi_old" })
  }
  const intent = (over: Record<string, unknown> = {}) => ({
    id: "pi_old", status: "succeeded", created: 1, amount_received: 6850, currency: "usd",
    metadata: { product: "bundle", customerEmail: BUYER }, latest_charge: { amount_refunded: 850, disputed: false }, ...over,
  })
  test("verified against Stripe: net is amount received less refunds", async () => {
    legacy()
    const { stripe, calls } = stubStripe({ intent: intent() })
    const check = await verifyBundlePayment(await readBundlePurchase(BUYER, db), stripe)
    assert.equal(check.state, "verified")
    if (check.state === "verified") {
      assert.equal(check.payment.amountPaidCents, 6850)
      assert.equal(check.payment.refundedCents, 850)
      assert.equal(check.payment.purchasedAt, PURCHASED)
    }
    assert.deepEqual(calls[0], { method: "paymentIntents.retrieve", args: ["pi_old", { expand: ["latest_charge"] }] })
  })
  test("a lost dispute found in Stripe counts as refunded", async () => {
    legacy()
    const { stripe } = stubStripe({ intent: intent({ latest_charge: { amount_refunded: 0, disputed: true } }), disputes: [{ status: "lost" }] })
    const check = await verifyBundlePayment(await readBundlePurchase(BUYER, db), stripe)
    assert.equal(check.state === "verified" && check.payment.dispute, "lost")
  })
  test("unverifiable: wrong product, wrong buyer, failed, unreachable, or no Stripe at all", async () => {
    legacy()
    const record = await readBundlePurchase(BUYER, db)
    for (const bad of [
      intent({ metadata: { product: "training", customerEmail: BUYER } }),
      intent({ metadata: { product: "bundle", customerEmail: "someone@else.test" } }),
      intent({ status: "requires_payment_method" }),
      intent({ latest_charge: "ch_1" }),
    ]) {
      assert.equal((await verifyBundlePayment(record, stubStripe({ intent: bad }).stripe)).state, "unverified")
    }
    assert.equal((await verifyBundlePayment(record, stubStripe({ intentThrows: true }).stripe)).state, "unverified")
    assert.equal((await verifyBundlePayment(record, null)).state, "unverified")
  })
  test("unverifiable legacy purchase: checkout adds no coupon", async () => {
    legacy()
    const { stripe, calls } = stubStripe({ intent: intent({ metadata: {} }) })
    const credit = await reserveCreditForCheckout({ stripe, db, readClient }, { application: creditApplicationOf(application("a1")), commitmentType: "THREE_MONTH_MINIMUM", priceCents: 39700, now: NOW })
    assert.equal(credit, null)
    assert.equal(calls.some((c) => c.method === "coupons.create"), false)
  })
})

describe("checkout", () => {
  const ctx = (over: Parameters<typeof stubStripe>[0] = {}) => {
    const s = stubStripe(over)
    return { ...s, deps: { stripe: s.stripe, db, readClient } }
  }
  const go = (deps: ReturnType<typeof ctx>["deps"], app: CoachingApplication, now = NOW) =>
    reserveCreditForCheckout(deps, { application: creditApplicationOf(app), commitmentType: "THREE_MONTH_MINIMUM", priceCents: app.approvedPriceInCents ?? 0, now })

  test("standard 3-month price: one coupon for the net amount, held for this application", async () => {
    await seedPurchase(6850)
    const { deps, calls } = ctx()
    const credit = await go(deps, application("a1"))
    assert.deepEqual(credit, { couponId: "coupon_1", email: BUYER, amountCents: 6850 })
    const create = calls.find((c) => c.method === "coupons.create")?.args[0] as Record<string, unknown>
    assert.equal(create.amount_off, 6850)
    assert.equal(create.duration, "once")
    assert.equal(create.max_redemptions, 1)
    assert.deepEqual((create.metadata as Record<string, string>).bundleCredit, "true")
    const r = await readBundlePurchase(BUYER, db)
    assert.equal(r?.usage.reservedForApplicationId, "a1")
    assert.equal(r?.usage.reservedCouponId, "coupon_1")
    assert.equal(r?.usage.usedAt, null)
  })
  test("custom price: no coupon unless Lisa ticked the box for that price", async () => {
    await seedPurchase()
    const { deps } = ctx()
    assert.equal(await go(deps, application("a1", { approvedPriceInCents: 25000 })), null)
    await saveBundleCreditChoice("a1", { apply: true, priceCents: 25000, decidedAt: NOW, decidedBy: "lisa" }, db)
    assert.equal((await go(deps, application("a1", { approvedPriceInCents: 25000 })))?.amountCents, 13700)
  })
  test("a choice made at one price doesn't carry to another", async () => {
    await seedPurchase()
    const { deps } = ctx()
    await saveBundleCreditChoice("a1", { apply: true, priceCents: 25000, decidedAt: NOW, decidedBy: "lisa" }, db)
    assert.equal(await go(deps, application("a1", { approvedPriceInCents: 30000 })), null)
  })
  test("standard price with the box unticked: no coupon", async () => {
    await seedPurchase()
    const { deps } = ctx()
    await saveBundleCreditChoice("a1", { apply: false, priceCents: 39700, decidedAt: NOW, decidedBy: "lisa" }, db)
    assert.equal(await go(deps, application("a1")), null)
  })
  test("credit larger than the first payment is capped at that payment", async () => {
    await seedPurchase()
    const { deps } = ctx()
    await saveBundleCreditChoice("a1", { apply: true, priceCents: 10000, decidedAt: NOW, decidedBy: "lisa" }, db)
    assert.equal((await go(deps, application("a1", { approvedPriceInCents: 10000 })))?.amountCents, 10000)
  })
  test("two applications racing: only one gets a coupon", async () => {
    await seedPurchase()
    const { deps, calls } = ctx()
    const [x, y] = await Promise.all([go(deps, application("a1")), go(deps, application("a2"))])
    assert.equal([x, y].filter(Boolean).length, 1)
    assert.equal(calls.filter((c) => c.method === "coupons.create").length, 1)
  })
  test("two holds written in the same instant: the conditional write lets only one through", async () => {
    await seedPurchase()
    let conflicts = 0
    const racing: CreditDb = {
      send: async (c) => {
        try {
          return (await table.send(c)) as { Item?: Record<string, unknown> }
        } catch (err) {
          conflicts += 1
          throw err
        }
      },
    }
    const results = await Promise.all([
      reserveBundleCredit({ email: BUYER, applicationId: "a1", until: "2026-11-06T00:00:00.000Z", now: NOW }, racing),
      reserveBundleCredit({ email: BUYER, applicationId: "a2", until: "2026-11-06T00:00:00.000Z", now: NOW }, racing),
    ])
    assert.deepEqual(results.sort(), [false, true])
    assert.equal(conflicts, 1)
  })
  test("a retry for the same application gets a fresh coupon on the same hold", async () => {
    await seedPurchase()
    const { deps } = ctx()
    await go(deps, application("a1"))
    const again = await go(deps, application("a1"))
    assert.equal(again?.couponId, "coupon_2")
    assert.equal((await readBundlePurchase(BUYER, db))?.usage.reservedCouponId, "coupon_2")
  })
  test("a lapsed hold frees the credit for another application", async () => {
    await seedPurchase()
    const { deps } = ctx()
    await go(deps, application("a1"))
    assert.equal(await go(deps, application("a2")), null)
    assert.ok(await go(deps, application("a2"), "2026-11-06T17:00:00.000Z"))
  })
  test("coupon failure gives the hold back and stops checkout", async () => {
    await seedPurchase()
    const { deps } = ctx({ couponThrows: true })
    await assert.rejects(go(deps, application("a1")), /Nothing was charged/)
    assert.equal((await readBundlePurchase(BUYER, db))?.usage.reservedForApplicationId, null)
  })
  test("Stripe unreachable while checking history: checkout stops instead of charging full price", async () => {
    await seedPurchase()
    const { deps } = ctx({ historyThrows: true })
    await assert.rejects(go(deps, application("a1")), /try again/)
  })
  test("billing-change applications never get a coupon", async () => {
    await seedPurchase()
    const { deps, calls } = ctx()
    const app = { ...application("a1"), billingChangeId: "chg_1" } as CoachingApplication
    assert.equal(await go(deps, app), null)
    assert.equal(calls.some((c) => c.method === "coupons.create"), false)
  })
  test("a client with a previous paid coaching invoice gets no coupon", async () => {
    await seedPurchase()
    const { deps } = ctx({
      customers: { [BUYER]: ["cus_1"] },
      subscriptions: { cus_1: [{ id: "sub_old", metadata: { product: "coaching" } }] },
      invoices: { sub_old: [{ id: "in_old", created: 1, status: "paid", amount_paid: 39700, total_discount_amounts: [] }] },
    })
    assert.equal(await go(deps, application("a1")), null)
  })
  test("a $0 trial invoice is not a previous coaching payment", async () => {
    const { stripe } = stubStripe({
      customers: { [BUYER]: ["cus_1"] },
      subscriptions: { cus_1: [{ id: "sub_t", metadata: { product: "coaching" } }] },
      invoices: { sub_t: [{ id: "in_t", created: 1, status: "paid", amount_paid: 0, total_discount_amounts: [] }] },
    })
    const h = await readCoachingHistory(stripe, [BUYER])
    assert.equal(h.verified && h.hasPriorPayment, false)
  })
  test("an application outside the window gets no coupon", async () => {
    await seedPurchase()
    const { deps } = ctx()
    assert.equal(await go(deps, application("a1", { applicationDate: "2027-03-01T15:00:00.000Z" }), "2027-03-02T00:00:00.000Z"), null)
  })
})

function invoiceStripe(meta: { email: string; amount: number; app?: string; coupon?: string }, status = "paid"): WebhookStripe {
  const coupon = meta.coupon ?? "coupon_1"
  return {
    invoices: {
      retrieve: async (id) => ({
        id, status,
        parent: { subscription_details: { subscription: "sub_new" } },
        discounts: [{ id: "di_1", source: { type: "coupon", coupon: { id: coupon, metadata: { bundleCredit: "true", bundleCreditEmail: meta.email, applicationId: meta.app ?? "a1" } } } }],
        total_discount_amounts: [{ amount: meta.amount, discount: "di_1" }],
      }),
    },
    paymentIntents: { retrieve: async () => null },
    coupons: { retrieve: async (id) => ({ id, metadata: { bundleCredit: "true", bundleCreditEmail: meta.email, applicationId: meta.app ?? "a1" } }) },
  }
}

describe("used only by a paid first invoice", () => {
  test("held is not used; the paid invoice marks it used once", async () => {
    await seedPurchase()
    const { stripe } = stubStripe()
    await reserveCreditForCheckout({ stripe, db, readClient }, { application: creditApplicationOf(application("a1")), commitmentType: "THREE_MONTH_MINIMUM", priceCents: 39700, now: NOW })
    assert.equal((await readBundlePurchase(BUYER, db))?.usage.usedAt, null)
    const first = await settleBundleCreditFromInvoice(invoiceStripe({ email: BUYER, amount: 13700 }), "in_1", db)
    assert.equal(first.outcome, "marked")
    const r = await readBundlePurchase(BUYER, db)
    assert.equal(r?.usage.usedForInvoiceId, "in_1")
    assert.equal(r?.usage.usedAmountCents, 13700)
    assert.equal(r?.usedForSubscriptionId, "sub_new")
    assert.equal(r?.usage.reservedForApplicationId, null)
    assert.equal((await settleBundleCreditFromInvoice(invoiceStripe({ email: BUYER, amount: 13700 }), "in_1", db)).outcome, "already-marked")
    assert.equal((await settleBundleCreditFromInvoice(invoiceStripe({ email: BUYER, amount: 13700 }), "in_2", db)).outcome, "conflict")
  })
  test("after use, no later application can reserve it", async () => {
    await seedPurchase()
    await settleBundleCreditFromInvoice(invoiceStripe({ email: BUYER, amount: 13700 }), "in_1", db)
    const { stripe } = stubStripe()
    assert.equal(await reserveCreditForCheckout({ stripe, db, readClient }, { application: creditApplicationOf(application("a2")), commitmentType: "THREE_MONTH_MINIMUM", priceCents: 39700, now: NOW }), null)
  })
  test("an unpaid or undiscounted invoice leaves the credit unused", async () => {
    await seedPurchase()
    assert.equal((await settleBundleCreditFromInvoice(invoiceStripe({ email: BUYER, amount: 13700 }, "open"), "in_1", db)).outcome, "none")
    assert.equal((await settleBundleCreditFromInvoice(invoiceStripe({ email: BUYER, amount: 0 }), "in_1", db)).outcome, "none")
    assert.equal((await readBundlePurchase(BUYER, db))?.usage.usedAt, null)
  })
  test("a failed payment leaves the credit held, then free when the hold lapses", async () => {
    await seedPurchase()
    const { stripe } = stubStripe()
    await reserveCreditForCheckout({ stripe, db, readClient }, { application: creditApplicationOf(application("a1")), commitmentType: "THREE_MONTH_MINIMUM", priceCents: 39700, now: NOW })
    const later = await assessBundleCredit({ stripe: null, db, readClient }, { application: creditApplicationOf(application("a2")), commitmentType: "THREE_MONTH_MINIMUM", priceCents: 39700, now: "2026-11-07T00:00:00.000Z" })
    assert.equal(later.plan.eligible, true)
    assert.equal(later.record?.usage.usedAt, null)
  })
  test("an expired checkout gives the hold back; an older session's expiry doesn't", async () => {
    await seedPurchase()
    const { stripe } = stubStripe()
    const deps = { stripe, db, readClient }
    const args = { application: creditApplicationOf(application("a1")), commitmentType: "THREE_MONTH_MINIMUM" as const, priceCents: 39700, now: NOW }
    await reserveCreditForCheckout(deps, args)
    await reserveCreditForCheckout(deps, args)
    const ws = invoiceStripe({ email: BUYER, amount: 0 })
    assert.equal(await releaseBundleCreditForSession(ws, { discounts: [{ coupon: "coupon_1" }] }, db), false)
    assert.equal((await readBundlePurchase(BUYER, db))?.usage.reservedForApplicationId, "a1")
    assert.equal(await releaseBundleCreditForSession(ws, { discounts: [{ coupon: "coupon_2" }] }, db), true)
    const r = await readBundlePurchase(BUYER, db)
    assert.equal(r?.usage.reservedForApplicationId, null)
    assert.equal(r?.usage.usedAt, null)
  })
  test("the invoice parser ignores coupons that aren't bundle credits", () => {
    assert.equal(bundleCreditDiscountOnInvoice({
      discounts: [{ id: "di_1", source: { coupon: { id: "promo", metadata: {} } } }],
      total_discount_amounts: [{ amount: 500, discount: "di_1" }],
    }), null)
  })
})

describe("history and summaries require real purchase data", () => {
  test("someone with a fake old record shows no purchase", async () => {
    table.put({ userId: `bundle_purchase_${BUYER}`, bundleCreditUsedAt: NOW, usedForCoachingSubscriptionId: "sub_1" })
    const a = await assessBundleCredit({ stripe: null, db, readClient }, { application: { id: null, email: BUYER, applicationDate: NOW }, commitmentType: null, priceCents: null, now: NOW })
    assert.equal(a.record, null)
    assert.equal(a.payment.state, "none")
    assert.deepEqual(a.plan.blocks, ["no-purchase"])
  })
  test("a coaching client record with a subscription counts as a previous payment", async () => {
    await seedPurchase()
    const a = await assessBundleCredit(
      { stripe: null, db, readClient: async () => ({ stripeSubscriptionId: "sub_1" }) },
      { application: creditApplicationOf(application("a1")), commitmentType: "THREE_MONTH_MINIMUM", priceCents: 39700, now: NOW },
    )
    assert.deepEqual(a.plan.blocks, ["returning-client"])
  })
  test("a purchase under the account email is found for an application under another address", async () => {
    await seedPurchase()
    const app = application("a1", { email: "other@example.test", ownerEmail: BUYER })
    const a = await assessBundleCredit({ stripe: null, db, readClient }, { application: creditApplicationOf(app), commitmentType: "THREE_MONTH_MINIMUM", priceCents: 39700, now: NOW })
    assert.equal(a.purchaseEmail, BUYER)
    assert.equal(a.plan.appliedCents, 13700)
  })
})
