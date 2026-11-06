import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { decideRefund, PRODUCT_GRANTS, type RefundFacts, type CourseEntitlement } from "./refundPolicy"

const CHARGE_AT = "2026-06-01T12:00:00.000Z"

function ent(entitlement: CourseEntitlement, over: Partial<RefundFacts["entitlements"][0]> = {}) {
  return {
    entitlement,
    coveredByOtherPurchase: false,
    grantType: "purchase" as string | null,
    grantedAt: CHARGE_AT,
    present: true,
    ...over,
  }
}

function facts(over: Partial<RefundFacts> = {}): RefundFacts {
  return {
    product: "training",
    email: "buyer@example.com",
    amount: 4700,
    amountRefunded: 4700,
    chargeCreatedAt: CHARGE_AT,
    entitlements: [ent("training")],
    ...over,
  }
}

describe("Refund policy — when access is taken back", () => {
  test("a full refund removes the course it paid for", () => {
    const d = decideRefund(facts())
    assert.deepEqual(d.revoke, ["training"])
    assert.equal(d.notifyOnly, false)
  })

  test("a partial refund never removes anything", () => {
    const d = decideRefund(facts({ amountRefunded: 2000 }))
    assert.deepEqual(d.revoke, [])
    assert.equal(d.notifyOnly, true)
    assert.match(d.summary, /Partial refund/)
  })

  test("a refunded bundle removes both courses it covered", () => {
    const d = decideRefund(facts({ product: "bundle", entitlements: [ent("training"), ent("nutrition")] }))
    assert.deepEqual(d.revoke.sort(), ["nutrition", "training"])
  })

  test("a course still covered by another purchase is kept", () => {
    const d = decideRefund(facts({ entitlements: [ent("training", { coveredByOtherPurchase: true })] }))
    assert.deepEqual(d.revoke, [])
    assert.match(d.keep[0].because, /another purchase/)
  })

  test("a bundle refund keeps the half that another purchase still covers", () => {
    const d = decideRefund(facts({
      product: "bundle",
      entitlements: [ent("training", { coveredByOtherPurchase: true }), ent("nutrition")],
    }))
    assert.deepEqual(d.revoke, ["nutrition"])
    assert.equal(d.keep.length, 1)
  })

  test("complimentary access is never removed by someone else's refund", () => {
    const d = decideRefund(facts({ entitlements: [ent("training", { grantType: "complimentary" })] }))
    assert.deepEqual(d.revoke, [])
    assert.match(d.keep[0].because, /complimentary/)
  })

  test("access granted by an admin is never removed by a refund", () => {
    const d = decideRefund(facts({ entitlements: [ent("training", { grantType: "admin" })] }))
    assert.deepEqual(d.revoke, [])
  })

  test("access granted well after the refunded charge came from elsewhere, so it stays", () => {
    const d = decideRefund(facts({ entitlements: [ent("training", { grantedAt: "2026-09-01T00:00:00.000Z" })] }))
    assert.deepEqual(d.revoke, [])
    assert.match(d.keep[0].because, /after this charge/)
  })

  test("access granted moments after the charge is still that charge's", () => {
    const d = decideRefund(facts({ entitlements: [ent("training", { grantedAt: "2026-06-01T12:00:30.000Z" })] }))
    assert.deepEqual(d.revoke, ["training"])
  })

  test("nothing to remove when there is no access record", () => {
    const d = decideRefund(facts({ entitlements: [ent("training", { present: false })] }))
    assert.deepEqual(d.revoke, [])
    assert.equal(d.notifyOnly, true)
  })
})

describe("Refund policy — when it refuses to act", () => {
  test("a coaching refund never touches the portal", () => {
    const d = decideRefund(facts({ product: "coaching" }))
    assert.deepEqual(d.revoke, [])
    assert.match(d.summary, /subscription/i)
  })

  test("a masterclass refund never touches access", () => {
    const d = decideRefund(facts({ product: "masterclass" }))
    assert.deepEqual(d.revoke, [])
  })

  test("a charge with no customer email removes nothing", () => {
    const d = decideRefund(facts({ email: "" }))
    assert.deepEqual(d.revoke, [])
    assert.match(d.summary, /No customer email/)
  })

  test("an unrecognised product removes nothing", () => {
    const d = decideRefund(facts({ product: "mystery-box", entitlements: [] }))
    assert.deepEqual(d.revoke, [])
    assert.match(d.summary, /Could not map/)
  })

  test("a legacy charge with no product is treated as Training Foundations", () => {
    assert.deepEqual(PRODUCT_GRANTS.training, ["training"])
    const d = decideRefund(facts({ product: null }))
    assert.deepEqual(d.revoke, ["training"])
  })
})

describe("Refund policy — unreadable input never costs someone access", () => {
  test("an unreadable charge date keeps access rather than guessing", () => {
    const d = decideRefund(facts({ chargeCreatedAt: "" }))
    assert.deepEqual(d.revoke, [])
    assert.match(d.keep[0].because, /unreadable/)
  })

  test("a missing grant date still revokes when everything else lines up", () => {
    const d = decideRefund(facts({ entitlements: [ent("training", { grantedAt: null })] }))
    assert.deepEqual(d.revoke, ["training"])
  })
})
