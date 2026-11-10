import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { FakeTable } from "./testing/fakeDynamo"
import { recordBundlePayment, recordBundleRefund, type CreditDb } from "./bundleCreditStore"
import { planBundleCredit } from "./bundleCredit"
import { buildPaymentSummary, type SummaryDeps } from "./paymentSummary"
import type { StripeReader } from "./bundleCreditStripe"
import type { CoachingApplication } from "./authTokens"

// The admin payment summary, built against an in-memory table and a Stripe
// stub that records every call. Only reads are possible through the stub.

const BUYER = "buyer@example.test"
const NOW = "2026-11-05T15:00:00.000Z"
let table: FakeTable
let db: CreditDb

beforeEach(() => {
  table = new FakeTable(50)
  db = { send: async (c) => (await table.send(c)) as { Item?: Record<string, unknown> } }
})

const app: CoachingApplication = {
  userId: "coaching_app_a1", id: "a1", email: BUYER, name: "Buyer", goals: "", currentFitnessLevel: "", whyCoaching: "",
  status: "PENDING", applicationDate: "2026-11-03T15:00:00.000Z",
}

function stripe(over: { intentThrows?: boolean; listThrows?: boolean; invoices?: unknown[] } = {}) {
  const methods: string[] = []
  const s: StripeReader = {
    paymentIntents: { retrieve: async () => { methods.push("paymentIntents.retrieve"); if (over.intentThrows) throw new Error("x"); return null } },
    disputes: { list: async () => { methods.push("disputes.list"); return { data: [] } } },
    customers: { list: async () => { methods.push("customers.list"); if (over.listThrows) throw new Error("x"); return { data: [{ id: "cus_1" }] } } },
    subscriptions: { list: async () => { methods.push("subscriptions.list"); return { data: [{ id: "sub_1", metadata: { product: "coaching" } }] } } },
    invoices: { list: async () => { methods.push("invoices.list"); return { data: over.invoices ?? [] } } },
  }
  return { s, methods }
}

function deps(s: StripeReader): SummaryDeps {
  return {
    stripe: s, db,
    readClient: async () => null,
    readApplication: async (id) => (id === "a1" ? app : null),
    latestApplicationFor: async () => app,
  }
}

describe("payment summary", () => {
  test("shows paid, refunded and net for a verified purchase, and the first month", async () => {
    await recordBundlePayment({ email: BUYER, paymentIntentId: "pi_1", purchasedAt: "2026-11-01T15:00:00.000Z", amountPaidCents: 13700, currency: "usd" }, db)
    await recordBundleRefund({ email: BUYER, paymentIntentId: "pi_1", refundedCents: 6850 }, db)
    const { s, methods } = stripe()
    const sum = await buildPaymentSummary(deps(s), { email: BUYER, applicationId: "a1", commitmentType: "THREE_MONTH_MINIMUM", priceCents: 39700, now: NOW })
    assert.ok(sum)
    assert.equal(sum.purchase?.verified, true)
    assert.equal(sum.purchase?.paidCents, 13700)
    assert.equal(sum.purchase?.refundedCents, 6850)
    assert.equal(sum.purchase?.netCents, 6850)
    assert.equal(sum.standardPrices.THREE_MONTH_MINIMUM, 39700)
    const plan = planBundleCredit({ ...sum.facts, commitmentType: "THREE_MONTH_MINIMUM", priceCents: 39700, applyChoice: null })
    assert.equal(plan.appliedCents, 6850)
    assert.equal(plan.firstMonthCents, 32850)
    assert.ok(methods.every((m) => /\.(retrieve|list)$/.test(m)))
    assert.equal(methods.includes("paymentIntents.retrieve"), false)
  })
  test("custom price: the panel's plan defaults the credit off and Lisa can opt in", async () => {
    await recordBundlePayment({ email: BUYER, paymentIntentId: "pi_1", purchasedAt: "2026-11-01T15:00:00.000Z", amountPaidCents: 13700, currency: "usd" }, db)
    const sum = await buildPaymentSummary(deps(stripe().s), { email: BUYER, applicationId: "a1", commitmentType: "THREE_MONTH_MINIMUM", priceCents: 20000, now: NOW })
    assert.ok(sum)
    const off = planBundleCredit({ ...sum.facts, commitmentType: "THREE_MONTH_MINIMUM", priceCents: 20000, applyChoice: null })
    assert.equal(off.apply, false)
    assert.equal(off.firstMonthCents, 20000)
    const on = planBundleCredit({ ...sum.facts, commitmentType: "THREE_MONTH_MINIMUM", priceCents: 20000, applyChoice: true })
    assert.equal(on.firstMonthCents, 6300)
  })
  test("an older record Stripe can't confirm reads 'couldn't verify' with no figures", async () => {
    table.put({ userId: `bundle_purchase_${BUYER}`, email: BUYER, purchasedAt: "2026-11-01T15:00:00.000Z", paymentIntentId: "pi_old" })
    const sum = await buildPaymentSummary(deps(stripe({ intentThrows: true }).s), { email: BUYER, applicationId: "a1", commitmentType: null, priceCents: null, now: NOW })
    assert.equal(sum?.purchase?.verified, false)
    assert.equal(sum?.purchase?.netCents, null)
    assert.match(sum?.purchase?.unverifiedReason ?? "", /couldn't be reached/)
  })
  test("lists previous coaching invoices with discounts, or says it couldn't check", async () => {
    const invoices = [{ id: "in_1", created: 1_700_000_000, status: "paid", amount_paid: 26000, total_discount_amounts: [{ amount: 13700, discount: "di_1" }] }]
    const sum = await buildPaymentSummary(deps(stripe({ invoices }).s), { email: BUYER, applicationId: "a1", commitmentType: null, priceCents: null, now: NOW })
    assert.equal(sum?.coachingPayments.verified, true)
    assert.equal(sum?.coachingPayments.invoices[0].discountCents, 13700)
    assert.equal(sum?.facts.hasPriorCoachingPayment, true)
    const down = await buildPaymentSummary(deps(stripe({ listThrows: true }).s), { email: BUYER, applicationId: "a1", commitmentType: null, priceCents: null, now: NOW })
    assert.equal(down?.coachingPayments.verified, false)
    assert.equal(down?.facts.hasPriorCoachingPayment, null)
  })
  test("an unknown application id is not found", async () => {
    assert.equal(await buildPaymentSummary(deps(stripe().s), { email: BUYER, applicationId: "nope", commitmentType: null, priceCents: null, now: NOW }), null)
  })
})
