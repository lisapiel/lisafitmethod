import { test, describe, beforeEach } from "node:test"
import assert from "node:assert/strict"
import type Stripe from "stripe"
import { FakeTable } from "./testing/fakeDynamo"
import {
  checkoutExpiresAt, checkoutIdempotencyKey, checkoutTermsKey, decideCheckout, mintCheckoutSession,
  type CheckoutFacts, type MintDeps, type SessionStripe,
} from "./coachingCheckout"
import { readBundlePurchase, recordBundlePayment, releaseBundleCredit, reserveBundleCredit, attachReservedCoupon, type CreditDb } from "./bundleCreditStore"
import type { CheckoutCredit } from "./bundleCreditAssess"

// The parts of minting a coaching checkout that decide money: which session
// is reused, what Stripe is asked for, and what is given back on failure.
// Stripe and the table are stubs; nothing leaves the process.

const NOW = Date.UTC(2026, 10, 5, 15, 0, 0)
const HOUR = 60 * 60 * 1000
const BUYER = "buyer@example.test"

const TERMS = checkoutTermsKey({ priceCents: 39700, commitmentType: "THREE_MONTH_MINIMUM", creditChoice: null })

function facts(over: Partial<CheckoutFacts> = {}): CheckoutFacts {
  return { applicationStatus: "APPROVED", clientStatus: "PENDING_PAYMENT", liveSubscriptionId: null, existingSession: null, termsKey: TERMS, now: NOW, ...over }
}

const openSession = (termsKey: string | null) => ({
  status: "open", paymentStatus: "unpaid", url: "https://checkout.stripe.com/old", expiresAtMs: NOW + 6 * HOUR, termsKey,
})

describe("reusing an open session only on the same terms", () => {
  test("same terms: the open session is reused", () => {
    assert.deepEqual(decideCheckout(facts({ existingSession: openSession(TERMS) })), { action: "reuse", url: "https://checkout.stripe.com/old" })
  })
  test("new price, commitment or credit choice: a new session", () => {
    for (const changed of [
      checkoutTermsKey({ priceCents: 35000, commitmentType: "THREE_MONTH_MINIMUM", creditChoice: null }),
      checkoutTermsKey({ priceCents: 39700, commitmentType: "MONTH_TO_MONTH", creditChoice: null }),
      checkoutTermsKey({ priceCents: 39700, commitmentType: "THREE_MONTH_MINIMUM", creditChoice: false }),
    ]) {
      assert.notEqual(changed, TERMS)
      assert.deepEqual(decideCheckout(facts({ existingSession: openSession(changed) })), { action: "create" })
    }
  })
  test("a session made before terms were recorded is replaced", () => {
    assert.deepEqual(decideCheckout(facts({ existingSession: openSession(null) })), { action: "create" })
  })
  test("a completed session on old terms still means wait, never a second checkout", () => {
    const done = { ...openSession("old"), status: "complete", paymentStatus: "paid" }
    assert.deepEqual(decideCheckout(facts({ existingSession: done })), { action: "awaiting-activation" })
  })
})

describe("the idempotency key follows the request", () => {
  const params = (coupon: string | null) => ({ mode: "subscription", unit_amount: 39700, discounts: coupon ? [{ coupon }] : [], expires_at: checkoutExpiresAt(NOW) })
  test("the same request twice gets the same key, so Stripe returns one session", () => {
    assert.equal(checkoutIdempotencyKey("a1", params("coupon_1"), null), checkoutIdempotencyKey("a1", params("coupon_1"), null))
  })
  test("a different coupon, application or replaced session gets a different key", () => {
    const base = checkoutIdempotencyKey("a1", params("coupon_1"), null)
    assert.notEqual(checkoutIdempotencyKey("a1", params("coupon_2"), null), base)
    assert.notEqual(checkoutIdempotencyKey("a1", params(null), null), base)
    assert.notEqual(checkoutIdempotencyKey("a2", params("coupon_1"), null), base)
    assert.notEqual(checkoutIdempotencyKey("a1", params("coupon_1"), "cs_old"), base)
  })
  test("expiry is the same for requests a moment apart and stays inside Stripe's 24 hours", () => {
    const start = Math.floor(NOW / 600_000) * 600_000
    assert.equal(checkoutExpiresAt(start + 1_000), checkoutExpiresAt(start + 590_000))
    for (const at of [start, start + 599_999]) {
      const ahead = checkoutExpiresAt(at) - at / 1000
      assert.ok(ahead <= 24 * 3600 && ahead > 23.8 * 3600)
    }
  })
})

type Created = { params: Stripe.Checkout.SessionCreateParams; key: string }

function sessionStripe(over: {
  createThrows?: unknown
  noUrl?: boolean
  expireThrows?: boolean
  retrieveAfterExpire?: { status: string; payment_status: string } | "throws"
} = {}) {
  const created: Created[] = []
  const expired: string[] = []
  const stripe: SessionStripe = {
    checkout: {
      sessions: {
        create: async (params, options) => {
          created.push({ params, key: options.idempotencyKey })
          if (over.createThrows) throw over.createThrows
          return { id: `cs_${created.length}`, url: over.noUrl ? null : `https://checkout.stripe.com/${created.length}`, expires_at: params.expires_at ?? 0 }
        },
        expire: async (id) => {
          expired.push(id)
          if (over.expireThrows) throw new Error("session is not open")
          return {}
        },
        retrieve: async (id) => {
          const r = over.retrieveAfterExpire
          if (!r || r === "throws") throw new Error("network")
          return { id, url: null, expires_at: 0, ...r }
        },
      },
    },
  }
  return { stripe, created, expired }
}

const params = (couponId: string | null, expiresAt: number): Stripe.Checkout.SessionCreateParams => ({
  mode: "subscription",
  line_items: [{ price_data: { currency: "usd", product_data: { name: "Coaching" }, unit_amount: 39700, recurring: { interval: "month" } }, quantity: 1 }],
  ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
  metadata: { checkoutTerms: TERMS },
  expires_at: expiresAt,
})

let table: FakeTable
let db: CreditDb
const until = new Date(NOW + 25 * HOUR).toISOString()
const nowIso = new Date(NOW).toISOString()

beforeEach(async () => {
  table = new FakeTable(50)
  db = { send: async (c) => (await table.send(c)) as { Item?: Record<string, unknown> } }
  await recordBundlePayment({ email: BUYER, paymentIntentId: "pi_bundle", purchasedAt: "2026-11-01T15:00:00.000Z", amountPaidCents: 13700, currency: "usd" }, db)
})

// Holds the credit for a1 in the real store, the way checkout does.
async function holdFor(couponId: string): Promise<CheckoutCredit> {
  await reserveBundleCredit({ email: BUYER, applicationId: "a1", until, now: nowIso }, db)
  await attachReservedCoupon({ email: BUYER, applicationId: "a1", couponId }, db)
  return { couponId, email: BUYER, amountCents: 13700 }
}

function deps(stripe: SessionStripe, reserve: () => Promise<CheckoutCredit | null>, log: string[] = []): MintDeps {
  return {
    stripe,
    reserveCredit: async () => { log.push("reserve"); return reserve() },
    releaseCredit: async (credit) => { log.push(`release ${credit.couponId}`); return releaseBundleCredit({ email: credit.email, applicationId: "a1", couponId: credit.couponId }, db) },
    releaseReplacedCredit: async () => { log.push("release replaced") },
    now: () => NOW,
  }
}

describe("minting a session", () => {
  const input = (replaces: { id: string; open: boolean } | null = null) => ({ applicationId: "a1", replaces, termsKey: TERMS, buildParams: params })

  test("the coupon goes on the session, and the key covers it", async () => {
    const { stripe, created } = sessionStripe()
    const r = await mintCheckoutSession(deps(stripe, () => holdFor("coupon_1")), input())
    assert.equal(r.kind, "created")
    assert.deepEqual(created[0].params.discounts, [{ coupon: "coupon_1" }])
    assert.equal(created[0].key, checkoutIdempotencyKey("a1", created[0].params, null))
    assert.equal((await readBundlePurchase(BUYER, db))?.usage.reservedCouponId, "coupon_1")
  })
  test("Stripe refusing the session gives the hold back and keeps the credit unused", async () => {
    const { stripe } = sessionStripe({ createThrows: Object.assign(new Error("Keys for idempotent requests can only be used with the same parameters"), { type: "StripeIdempotencyError" }) })
    await assert.rejects(mintCheckoutSession(deps(stripe, () => holdFor("coupon_1")), input()), /idempotent/)
    const r = await readBundlePurchase(BUYER, db)
    assert.equal(r?.usage.reservedForApplicationId, null)
    assert.equal(r?.usage.usedAt, null)
  })
  test("a session with no URL gives the hold back too", async () => {
    const { stripe } = sessionStripe({ noUrl: true })
    await assert.rejects(mintCheckoutSession(deps(stripe, () => holdFor("coupon_1")), input()), /without a URL/)
    assert.equal((await readBundlePurchase(BUYER, db))?.usage.reservedForApplicationId, null)
  })
  test("a failure only gives back its own hold, not a newer checkout's", async () => {
    const { stripe } = sessionStripe({ createThrows: new Error("stripe down") })
    await assert.rejects(mintCheckoutSession(deps(stripe, async () => {
      const mine = await holdFor("coupon_1")
      await holdFor("coupon_2")
      return mine
    }), input()), /stripe down/)
    assert.equal((await readBundlePurchase(BUYER, db))?.usage.reservedCouponId, "coupon_2")
  })
  test("no credit: a failure has nothing to give back", async () => {
    const { stripe } = sessionStripe({ createThrows: new Error("stripe down") })
    const log: string[] = []
    await assert.rejects(mintCheckoutSession(deps(stripe, async () => null, log), input()), /stripe down/)
    assert.deepEqual(log, ["reserve"])
  })
})

describe("replacing a session on old terms", () => {
  const input = { applicationId: "a1", replaces: { id: "cs_old", open: true }, termsKey: TERMS, buildParams: params }

  test("the old session is closed and its hold given back before the new one is made", async () => {
    const { stripe, created, expired } = sessionStripe()
    const log: string[] = []
    const r = await mintCheckoutSession(deps(stripe, async () => null, log), input)
    assert.equal(r.kind, "created")
    assert.deepEqual(expired, ["cs_old"])
    assert.deepEqual(log, ["release replaced", "reserve"])
    assert.equal(created.length, 1)
    assert.equal(created[0].params.discounts, undefined)
  })
  test("already closed: carries on", async () => {
    const { stripe, created } = sessionStripe({ expireThrows: true, retrieveAfterExpire: { status: "expired", payment_status: "unpaid" } })
    assert.equal((await mintCheckoutSession(deps(stripe, async () => null), input)).kind, "created")
    assert.equal(created.length, 1)
  })
  test("paid in the meantime: no second session, and nothing held", async () => {
    const { stripe, created } = sessionStripe({ expireThrows: true, retrieveAfterExpire: { status: "complete", payment_status: "paid" } })
    const log: string[] = []
    const r = await mintCheckoutSession(deps(stripe, async () => null, log), input)
    assert.deepEqual(r, { kind: "awaiting-activation", sessionId: "cs_old" })
    assert.equal(created.length, 0)
    assert.deepEqual(log, [])
  })
  test("can't tell what happened to it: stops rather than risk two ways to pay", async () => {
    const { stripe, created } = sessionStripe({ expireThrows: true, retrieveAfterExpire: "throws" })
    const log: string[] = []
    await assert.rejects(mintCheckoutSession(deps(stripe, async () => null, log), input), /Nothing was charged/)
    assert.equal(created.length, 0)
    assert.deepEqual(log, [])
  })
})
