import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  BUNDLE_CREDIT_30_DAY_CUTOVER, NO_USAGE, applicationWindowDays, appliedWithinWindow, applyByDay, bundleNetPaidCents,
  canReserve, creditFormStatus, decideSettlement, formatCents, planBundleCredit, shouldRelease,
  type BundlePaymentCheck, type CreditPlanInput, type CreditUsage, type VerifiedBundlePayment,
} from "./bundleCredit"

const PURCHASE = "2027-03-01T15:00:00.000Z" // 10am in New York
const NOW = "2027-03-05T12:00:00.000Z"

function paid(amountPaidCents: number, extra: Partial<VerifiedBundlePayment> = {}): BundlePaymentCheck {
  return {
    state: "verified",
    payment: { paymentIntentId: "pi_1", purchasedAt: PURCHASE, amountPaidCents, refundedCents: 0, currency: "usd", dispute: "none", ...extra },
  }
}

function input(over: Partial<CreditPlanInput> = {}): CreditPlanInput {
  return {
    payment: paid(13700),
    usage: NO_USAGE,
    applicationId: "app1",
    applicationDate: "2027-03-04T12:00:00.000Z",
    commitmentType: "THREE_MONTH_MINIMUM",
    isBillingChange: false,
    hasPriorCoachingPayment: false,
    priceCents: 39700,
    applyChoice: null,
    now: NOW,
    ...over,
  }
}

const daysAfter = (iso: string, days: number, hours = 0) => new Date(new Date(iso).getTime() + days * 86_400_000 + hours * 3_600_000).toISOString()

describe("the credit is the net amount actually paid for the bundle", () => {
  test("paid $137 gives $137", () => {
    const p = planBundleCredit(input())
    assert.equal(p.eligibleCreditCents, 13700)
    assert.equal(p.appliedCents, 13700)
    assert.equal(p.firstMonthCents, 39700 - 13700)
  })
  test("paid $68.50 with a 50% promo gives $68.50", () => {
    const p = planBundleCredit(input({ payment: paid(6850) }))
    assert.equal(p.appliedCents, 6850)
    assert.equal(p.firstMonthCents, 32850)
  })
  test("paid $0.50 gives $0.50", () => {
    const p = planBundleCredit(input({ payment: paid(50) }))
    assert.equal(p.appliedCents, 50)
    assert.equal(p.firstMonthCents, 39650)
  })
  test("a full refund leaves nothing to credit", () => {
    const p = planBundleCredit(input({ payment: paid(13700, { refundedCents: 13700 }) }))
    assert.equal(p.eligible, false)
    assert.deepEqual(p.blocks, ["refunded"])
    assert.equal(p.appliedCents, 0)
    assert.equal(p.firstMonthCents, 39700)
  })
  test("a partial refund reduces the credit", () => {
    const p = planBundleCredit(input({ payment: paid(13700, { refundedCents: 5000 }) }))
    assert.equal(p.appliedCents, 8700)
  })
  test("a lost dispute counts as a full refund", () => {
    assert.equal(bundleNetPaidCents({ amountPaidCents: 13700, refundedCents: 0, dispute: "lost" }), 0)
    const p = planBundleCredit(input({ payment: paid(13700, { dispute: "lost" }) }))
    assert.deepEqual(p.blocks, ["refunded"])
  })
  test("an open dispute stops the credit until it is settled", () => {
    assert.deepEqual(planBundleCredit(input({ payment: paid(13700, { dispute: "open" }) })).blocks, ["disputed"])
  })
  test("a refund larger than the payment never goes negative", () => {
    assert.equal(bundleNetPaidCents({ amountPaidCents: 100, refundedCents: 500, dispute: "none" }), 0)
  })
  test("a non-USD payment is not credited automatically", () => {
    assert.deepEqual(planBundleCredit(input({ payment: paid(13700, { currency: "cad" }) })).blocks, ["currency"])
  })
})

describe("purchases that can't be verified", () => {
  test("no purchase means no credit, never an assumed one", () => {
    const p = planBundleCredit(input({ payment: { state: "none" } }))
    assert.deepEqual(p.blocks, ["no-purchase"])
    assert.equal(p.appliedCents, 0)
  })
  test("an unverified older record applies no credit and says so", () => {
    const p = planBundleCredit(input({ payment: { state: "unverified", purchasedAt: PURCHASE, paymentIntentId: "pi_1", reason: "x" } }))
    assert.deepEqual(p.blocks, ["unverified"])
    assert.equal(p.apply, false)
    assert.equal(creditFormStatus(p), "check")
  })
  test("unverified coaching history blocks an automatic credit", () => {
    const p = planBundleCredit(input({ hasPriorCoachingPayment: null }))
    assert.deepEqual(p.blocks, ["history-unverified"])
    assert.equal(p.appliedCents, 0)
  })
})

describe("application window", () => {
  const cutover = "2027-02-01T05:00:00.000Z"
  test("purchases before the cutover keep 90 days, on or after get 30", () => {
    assert.equal(applicationWindowDays("2027-01-31T23:59:00.000Z", cutover), 90)
    assert.equal(applicationWindowDays("2027-02-01T05:00:00.000Z", cutover), 30)
    assert.equal(applicationWindowDays(PURCHASE, cutover), 30)
  })
  test("the default cutover is a future placeholder, so everyone keeps 90 days for now", () => {
    assert.ok(new Date(BUNDLE_CREDIT_30_DAY_CUTOVER).getTime() > new Date("2026-11-10T00:00:00Z").getTime())
    assert.equal(applicationWindowDays(PURCHASE), 90)
  })
  for (const [day, ok] of [[29, true], [30, true], [31, false]] as const) {
    test(`30-day window: application on day ${day} is ${ok ? "in" : "out"}`, () => {
      assert.equal(appliedWithinWindow(PURCHASE, daysAfter(PURCHASE, day), cutover), ok)
      const p = planBundleCredit(input({ applicationDate: daysAfter(PURCHASE, day), cutover }))
      assert.equal(p.eligible, ok)
      assert.equal(p.windowDays, 30)
    })
  }
  test("30-day window: 11pm on day 30 in New York still counts, midnight starts day 31", () => {
    assert.equal(appliedWithinWindow(PURCHASE, daysAfter(PURCHASE, 30, 12), cutover), true)
    assert.equal(appliedWithinWindow(PURCHASE, daysAfter(PURCHASE, 30, 13), cutover), false)
    assert.equal(applyByDay(PURCHASE, cutover), "2027-03-31")
  })
  const legacy = "2026-10-01T15:00:00.000Z"
  for (const [day, ok] of [[89, true], [90, true], [91, false]] as const) {
    test(`90-day window (before cutover): application on day ${day} is ${ok ? "in" : "out"}`, () => {
      assert.equal(appliedWithinWindow(legacy, daysAfter(legacy, day), cutover), ok)
      const p = planBundleCredit(input({ payment: paid(13700, { purchasedAt: legacy }), applicationDate: daysAfter(legacy, day), cutover }))
      assert.equal(p.eligible, ok)
      assert.equal(p.windowDays, 90)
      if (!ok) assert.deepEqual(p.blocks, ["window"])
    })
  }
  test("the window is about the application date, not when coaching starts", () => {
    const p = planBundleCredit(input({ applicationDate: daysAfter(PURCHASE, 10), now: daysAfter(PURCHASE, 200), cutover }))
    assert.equal(p.eligible, true)
  })
  test("an application before the purchase doesn't count", () => {
    assert.equal(appliedWithinWindow(PURCHASE, daysAfter(PURCHASE, -2), cutover), false)
  })
})

describe("plan and price", () => {
  test("month-to-month is allowed but gets no credit", () => {
    const p = planBundleCredit(input({ commitmentType: "MONTH_TO_MONTH", priceCents: 49700 }))
    assert.deepEqual(p.blocks, ["month-to-month"])
    assert.equal(p.appliedCents, 0)
    assert.equal(p.firstMonthCents, 49700)
  })
  test("month-to-month stays uncredited even if the box is ticked", () => {
    assert.equal(planBundleCredit(input({ commitmentType: "MONTH_TO_MONTH", priceCents: 49700, applyChoice: true })).appliedCents, 0)
  })
  test("standard price: the credit is on by default", () => {
    const p = planBundleCredit(input())
    assert.equal(p.isCustomPrice, false)
    assert.equal(p.defaultApply, true)
    assert.equal(p.apply, true)
  })
  test("custom price: the credit is off by default", () => {
    const p = planBundleCredit(input({ priceCents: 25000 }))
    assert.equal(p.isCustomPrice, true)
    assert.equal(p.defaultApply, false)
    assert.equal(p.apply, false)
    assert.equal(p.firstMonthCents, 25000)
    assert.equal(p.eligibleCreditCents, 13700)
  })
  test("custom price: Lisa can opt in", () => {
    const p = planBundleCredit(input({ priceCents: 25000, applyChoice: true }))
    assert.equal(p.appliedCents, 13700)
    assert.equal(p.firstMonthCents, 11300)
    assert.equal(p.laterMonthlyCents, 25000)
  })
  test("standard price: Lisa can opt out", () => {
    assert.equal(planBundleCredit(input({ applyChoice: false })).appliedCents, 0)
  })
  test("the credit never exceeds the first payment", () => {
    const p = planBundleCredit(input({ priceCents: 10000, applyChoice: true }))
    assert.equal(p.appliedCents, 10000)
    assert.equal(p.firstMonthCents, 0)
  })
  test("no price yet means nothing is applied", () => {
    const p = planBundleCredit(input({ priceCents: null }))
    assert.equal(p.apply, false)
    assert.equal(p.firstMonthCents, null)
  })
  test("billing-change applications for existing clients never get the credit", () => {
    const p = planBundleCredit(input({ isBillingChange: true, applyChoice: true }))
    assert.deepEqual(p.blocks, ["billing-change"])
    assert.equal(p.appliedCents, 0)
  })
  test("a client who has paid for coaching before gets no credit", () => {
    assert.deepEqual(planBundleCredit(input({ hasPriorCoachingPayment: true })).blocks, ["returning-client"])
  })
})

describe("use and holds", () => {
  const used: CreditUsage = { ...NO_USAGE, usedAt: "2027-03-03T00:00:00.000Z", usedForInvoiceId: "in_1", usedAmountCents: 13700 }
  test("a used credit can't be applied again", () => {
    const p = planBundleCredit(input({ usage: used }))
    assert.deepEqual(p.blocks, ["used"])
    assert.equal(p.appliedCents, 0)
  })
  test("a live hold for another application blocks this one", () => {
    const held: CreditUsage = { ...NO_USAGE, reservedForApplicationId: "other", reservedUntil: "2027-03-06T00:00:00.000Z" }
    assert.deepEqual(planBundleCredit(input({ usage: held })).blocks, ["reserved-elsewhere"])
    assert.equal(canReserve(held, "app1", NOW), false)
    assert.equal(canReserve(held, "other", NOW), true)
  })
  test("a lapsed hold no longer blocks", () => {
    const lapsed: CreditUsage = { ...NO_USAGE, reservedForApplicationId: "other", reservedUntil: "2027-03-05T11:00:00.000Z" }
    assert.equal(planBundleCredit(input({ usage: lapsed })).eligible, true)
    assert.equal(canReserve(lapsed, "app1", NOW), true)
  })
  test("a used credit can't be reserved", () => {
    assert.equal(canReserve(used, "app1", NOW), false)
  })
  test("settlement marks once, then recognises the same invoice", () => {
    assert.deepEqual(decideSettlement(NO_USAGE, "in_1", 13700), { action: "mark" })
    assert.deepEqual(decideSettlement(used, "in_1", 13700), { action: "already-marked" })
    assert.deepEqual(decideSettlement(used, "in_2", 13700), { action: "conflict", usedForInvoiceId: "in_1" })
    assert.deepEqual(decideSettlement(NO_USAGE, "in_1", 0), { action: "skip", reason: "no-discount" })
  })
  test("release only gives back the hold this checkout made", () => {
    const held: CreditUsage = { ...NO_USAGE, reservedForApplicationId: "app1", reservedUntil: NOW, reservedCouponId: "c2" }
    assert.equal(shouldRelease(held, "app1", "c2"), true)
    assert.equal(shouldRelease(held, "app1", "c1"), false)
    assert.equal(shouldRelease(held, "app2", "c2"), false)
    assert.equal(shouldRelease(used, "app1", null), false)
  })
})

test("money formatting keeps cents only when there are some", () => {
  assert.equal(formatCents(13700), "$137")
  assert.equal(formatCents(6850), "$68.50")
  assert.equal(formatCents(50), "$0.50")
})
