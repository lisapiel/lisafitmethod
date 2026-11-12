import { test } from "node:test"
import assert from "node:assert/strict"
import { decideOnSubscriptionDeleted, type DeletionInput } from "./revocation"

const deleted = (o: Partial<DeletionInput["deleted"]> = {}): DeletionInput["deleted"] => ({
  id: "sub_1", pause: null, metadata: { product: "coaching" }, cancellationReason: null, cancelAtPeriodEnd: false, cancelAt: null, ...o,
})
const paused = { behavior: "void" as const, resumesAt: null }

test("paid client: deleting the linked subscription ends access, as before", () => {
  const d = decideOnSubscriptionDeleted({ deleted: deleted(), client: { stripeSubscriptionId: "sub_1" }, billing: { mode: "paid" } })
  assert.deepEqual(d, { action: "revoke", reason: "paid-subscription-ended" })
})

test("paid client with no billing record yet: still ends access", () => {
  assert.equal(decideOnSubscriptionDeleted({ deleted: deleted(), client: { stripeSubscriptionId: "sub_1" }, billing: null }).action, "revoke")
})

test("an old subscription ending never touches access (stale event), paid or complimentary", () => {
  for (const mode of ["paid", "complimentary"] as const) {
    const d = decideOnSubscriptionDeleted({ deleted: deleted({ id: "sub_old" }), client: { stripeSubscriptionId: "sub_new" }, billing: { mode } })
    assert.equal(d.action, "keep")
    assert.equal(d.action === "keep" && d.reason, "stale-subscription")
  }
})

test("complimentary: unexpected deletions keep access and alert, whatever the cause", () => {
  for (const reason of [null, "payment_failed", "payment_disputed", "cancellation_requested", "canceled_by_retention_policy"]) {
    const d = decideOnSubscriptionDeleted({ deleted: deleted({ pause: paused, cancellationReason: reason }), client: { stripeSubscriptionId: "sub_1" }, billing: { mode: "complimentary" } })
    assert.equal(d.action, "keep", String(reason))
    assert.ok(d.action === "keep" && d.alert)
  }
})

test("complimentary: a scheduled end that nobody asked for through us still keeps access", () => {
  // cancel_at_period_end set in the Stripe dashboard, but no cancellation on our record
  const d = decideOnSubscriptionDeleted({ deleted: deleted({ pause: paused, cancelAtPeriodEnd: true, cancellationReason: "cancellation_requested" }), client: { stripeSubscriptionId: "sub_1", cancellationScheduledAt: null }, billing: { mode: "complimentary" } })
  assert.equal(d.action, "keep")
})

test("complimentary: the client's own cancellation ends access at the scheduled end", () => {
  for (const sched of [{ cancelAtPeriodEnd: true }, { cancelAt: "2026-12-08T00:00:00.000Z" }]) {
    for (const reason of [null, "cancellation_requested"]) {
      const d = decideOnSubscriptionDeleted({ deleted: deleted({ pause: paused, cancellationReason: reason, ...sched }), client: { stripeSubscriptionId: "sub_1", cancellationScheduledAt: "2026-11-20T10:00:00.000Z" }, billing: { mode: "complimentary" } })
      assert.deepEqual(d, { action: "revoke", reason: "complimentary-cancellation-requested" })
    }
  }
})

test("complimentary: a requested cancellation that ends early because of a payment failure keeps access", () => {
  const d = decideOnSubscriptionDeleted({ deleted: deleted({ pause: paused, cancelAtPeriodEnd: true, cancellationReason: "payment_failed" }), client: { stripeSubscriptionId: "sub_1", cancellationScheduledAt: "2026-11-20T10:00:00.000Z" }, billing: { mode: "complimentary" } })
  assert.equal(d.action, "keep")
})

test("any one complimentary signal protects access, even if our own record didn't save", () => {
  const cases: Array<[string, DeletionInput]> = [
    ["Stripe pause only", { deleted: deleted({ pause: paused }), client: { stripeSubscriptionId: "sub_1" }, billing: { mode: "paid" } }],
    ["Stripe metadata only", { deleted: deleted({ metadata: { product: "coaching", lfm_billing_mode: "complimentary" } }), client: { stripeSubscriptionId: "sub_1" }, billing: null }],
    ["change in progress", { deleted: deleted(), client: { stripeSubscriptionId: "sub_1" }, billing: { mode: "paid", pendingKind: "MAKE_COMPLIMENTARY", pendingStatus: "UNCERTAIN" } }],
    ["Phase 1 client flag", { deleted: deleted(), client: { stripeSubscriptionId: "sub_1", accessType: "complimentary" }, billing: null }],
    ["billing record", { deleted: deleted(), client: { stripeSubscriptionId: "sub_1" }, billing: { mode: "complimentary" } }],
  ]
  for (const [name, input] of cases) assert.equal(decideOnSubscriptionDeleted(input).action, "keep", name)
})

test("a failed attempt to make someone complimentary doesn't count as complimentary", () => {
  const d = decideOnSubscriptionDeleted({ deleted: deleted(), client: { stripeSubscriptionId: "sub_1" }, billing: { mode: "paid", pendingKind: "MAKE_COMPLIMENTARY", pendingStatus: "FAILED" } })
  assert.equal(d.action, "revoke")
})

test("no client record at all: paid behaviour unless a Stripe signal says complimentary", () => {
  assert.equal(decideOnSubscriptionDeleted({ deleted: deleted(), client: null, billing: null }).action, "revoke")
  assert.equal(decideOnSubscriptionDeleted({ deleted: deleted({ pause: paused }), client: null, billing: null }).action, "keep")
})
