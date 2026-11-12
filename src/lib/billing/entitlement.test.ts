import { test } from "node:test"
import assert from "node:assert/strict"
import { coachingAccessDecision, complimentaryCancellationDate, complimentaryStatus, paysForCoaching, parseEndDate, type GrantFields } from "./entitlement"

// Expected outcomes follow Lisa's rules of 2026-11-12, not the code's output:
// complimentary is one explicit admin grant, indefinite unless an end date is
// set; it alone decides access while in place; it never qualifies for paid
// benefits; ending it never resumes paid billing.

const NOW = new Date("2026-11-20T12:00:00.000Z")
const grant = (o: Partial<GrantFields> = {}): GrantFields => ({ mode: "complimentary", modeSince: "2026-11-15T10:00:00.000Z", modeBy: "coach@test.example", compReason: "Family", ...o })

test("no billing record: the access switch decides, exactly as before", () => {
  assert.deepEqual(coachingAccessDecision({ switchActive: true, billing: null, now: NOW }), { access: true, basis: "paid" })
  assert.deepEqual(coachingAccessDecision({ switchActive: false, billing: null, now: NOW }), { access: false, basis: "none" })
  assert.equal(complimentaryStatus(null, NOW).state, "none")
})

test("paid billing record: the switch decides; nothing about price is consulted", () => {
  const paid = { mode: "paid" as const }
  assert.equal(coachingAccessDecision({ switchActive: true, billing: paid, now: NOW }).access, true)
  assert.equal(coachingAccessDecision({ switchActive: false, billing: paid, now: NOW }).access, false)
})

test("the old accessType field never makes anyone complimentary", () => {
  const legacy = { mode: "paid" as const, accessType: "complimentary" } as GrantFields
  assert.deepEqual(coachingAccessDecision({ switchActive: false, billing: legacy, now: NOW }), { access: false, basis: "none" })
  assert.equal(complimentaryStatus(legacy, NOW).state, "none")
})

test("active indefinite grant: access even if Stripe's deletion switched access off", () => {
  const s = complimentaryStatus(grant(), NOW)
  assert.ok(s.state === "active" && s.endsAt === null && s.reason === "Family" && s.by === "coach@test.example")
  assert.deepEqual(coachingAccessDecision({ switchActive: false, billing: grant(), now: NOW }), { access: true, basis: "complimentary" })
})

test("grant with an end date: access until then, none after; paid billing isn't implied", () => {
  const g = grant({ compEndsAt: "2026-12-31T23:59:59.000Z", compEndReason: "end-date" })
  assert.equal(coachingAccessDecision({ switchActive: true, billing: g, now: NOW }).access, true)
  const after = new Date("2027-01-01T00:00:00.000Z")
  const s = complimentaryStatus(g, after)
  assert.ok(s.state === "ended" && s.why === "end-date-reached")
  // The switch is still on (the paused subscription was never cancelled), yet access has ended.
  assert.deepEqual(coachingAccessDecision({ switchActive: true, billing: g, now: after }), { access: false, basis: "none" })
  assert.equal(paysForCoaching({ switchActive: true, billing: g, now: after }), false)
})

test("grant ended by an admin: no access, and the record says who and why", () => {
  const g = grant({ compEndedAt: "2026-11-18T09:00:00.000Z", compEndedBy: "coach@test.example", compEndNote: "Coaching finished" })
  const s = complimentaryStatus(g, NOW)
  assert.ok(s.state === "ended" && s.why === "ended-by-admin" && s.by === "coach@test.example" && s.note === "Coaching finished")
  assert.equal(coachingAccessDecision({ switchActive: true, billing: g, now: NOW }).access, false)
})

test("client cancellation: access until the cancellation date, then ended as client-cancelled", () => {
  const g = grant({ compEndsAt: "2026-12-08T01:04:51.000Z", compEndReason: "client-cancelled" })
  const before = complimentaryStatus(g, NOW)
  assert.ok(before.state === "active" && before.endsBecause === "client-cancelled")
  const after = complimentaryStatus(g, new Date("2026-12-09T00:00:00.000Z"))
  assert.ok(after.state === "ended" && after.why === "client-cancelled")
})

test("paid-client benefits: paying clients only; complimentary never qualifies", () => {
  assert.equal(paysForCoaching({ switchActive: true, billing: null, now: NOW }), true)
  assert.equal(paysForCoaching({ switchActive: true, billing: { mode: "paid" }, now: NOW }), true)
  assert.equal(paysForCoaching({ switchActive: true, billing: grant(), now: NOW }), false)
  assert.equal(paysForCoaching({ switchActive: false, billing: grant(), now: NOW }), false)
  assert.equal(paysForCoaching({ switchActive: false, billing: null, now: NOW }), false)
})

test("complimentary cancellation date: end of the Stripe period, never past an end date already set", () => {
  const base = { hasRunningSubscription: true, grantStart: "2026-11-15T10:00:00.000Z", now: NOW }
  // Period ends 8 Dec, no end date: 8 Dec.
  assert.equal(complimentaryCancellationDate({ ...base, periodEnd: "2026-12-08T01:04:51.000Z", currentEndsAt: null }), "2026-12-08T01:04:51.000Z")
  // End date 1 Dec comes first: 1 Dec.
  assert.equal(complimentaryCancellationDate({ ...base, periodEnd: "2026-12-08T01:04:51.000Z", currentEndsAt: "2026-12-01T23:59:59.000Z" }), "2026-12-01T23:59:59.000Z")
})

test("no Stripe subscription (approved rule): the arrangement's own monthly cycle from the day it was granted", () => {
  const base = { hasRunningSubscription: false, periodEnd: null, currentEndsAt: null, now: NOW }
  // Granted 15 Nov, now 20 Nov: the cycle ends 15 Dec (not "now", not a made-up Stripe date).
  assert.equal(complimentaryCancellationDate({ ...base, grantStart: "2026-11-15T10:00:00.000Z" }), "2026-12-15T10:00:00.000Z")
  // Granted on the 31st: clamped to the month's last day (30 Nov).
  assert.equal(complimentaryCancellationDate({ ...base, grantStart: "2026-10-31T09:00:00.000Z" }), "2026-11-30T09:00:00.000Z")
  // An earlier end date still wins.
  assert.equal(complimentaryCancellationDate({ ...base, grantStart: "2026-11-15T10:00:00.000Z", currentEndsAt: "2026-12-01T23:59:59.000Z" }), "2026-12-01T23:59:59.000Z")
})

test("no date is ever guessed (rule of 2026-11-12): unknown means null, and the caller refuses", () => {
  // A running subscription whose current period is missing or already past: unknown.
  assert.equal(complimentaryCancellationDate({ hasRunningSubscription: true, periodEnd: null, currentEndsAt: null, grantStart: "2026-11-15T10:00:00.000Z", now: NOW }), null)
  assert.equal(complimentaryCancellationDate({ hasRunningSubscription: true, periodEnd: "2026-11-01T00:00:00.000Z", currentEndsAt: null, grantStart: "2026-11-15T10:00:00.000Z", now: NOW }), null)
  // Even with an end date set, an unknown period means unknown (the period might end sooner).
  assert.equal(complimentaryCancellationDate({ hasRunningSubscription: true, periodEnd: null, currentEndsAt: "2026-12-01T23:59:59.000Z", grantStart: null, now: NOW }), null)
  // No subscription and no grant date: unknown.
  assert.equal(complimentaryCancellationDate({ hasRunningSubscription: false, periodEnd: null, currentEndsAt: null, grantStart: null, now: NOW }), null)
  assert.equal(complimentaryCancellationDate({ hasRunningSubscription: false, periodEnd: null, currentEndsAt: null, grantStart: "not a date", now: NOW }), null)
})

test("after complimentary ends, only an entitlement granted afterwards gives access", () => {
  const ended = grant({ compEndedAt: "2026-11-18T09:00:00.000Z", compEndedBy: "coach@test.example" })
  // The switch stayed on from before (the paused subscription still exists): no access.
  assert.equal(coachingAccessDecision({ switchActive: true, switchGrantedAt: "2026-06-10T00:00:00.000Z", billing: ended, now: NOW }).access, false)
  // Access turned on again after the end (e.g. a new paid sign-up): access, as paid.
  assert.deepEqual(coachingAccessDecision({ switchActive: true, switchGrantedAt: "2026-11-19T12:00:00.000Z", billing: ended, now: NOW }), { access: true, basis: "paid" })
  // Granted afterwards but switched off again: no access.
  assert.equal(coachingAccessDecision({ switchActive: false, switchGrantedAt: "2026-11-19T12:00:00.000Z", billing: ended, now: NOW }).access, false)
  // While the grant is active, the switch's grant time is irrelevant.
  assert.equal(coachingAccessDecision({ switchActive: false, switchGrantedAt: null, billing: grant(), now: NOW }).basis, "complimentary")
})

test("end dates: empty means indefinite; a calendar date runs to the end of that day; past or invalid dates are refused", () => {
  assert.deepEqual(parseEndDate("", NOW), { ok: true, endsAt: null })
  assert.deepEqual(parseEndDate(null, NOW), { ok: true, endsAt: null })
  assert.deepEqual(parseEndDate("2026-12-31", NOW), { ok: true, endsAt: "2026-12-31T23:59:59.000Z" })
  assert.equal(parseEndDate("2026-11-19", NOW).ok, false)
  assert.equal(parseEndDate("not a date", NOW).ok, false)
  assert.equal(parseEndDate(20261231, NOW).ok, false)
})
