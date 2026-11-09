import { test } from "node:test"
import assert from "node:assert/strict"
import { checkInWeightLine, hungerLabel, normalizeCheckInWeight, parseHunger } from "./checkInAnswers"

const from = { lbs: 125, unit: "LBS", at: "2026-11-08", source: "logged" }

test("a new weight is saved with its unit and status", () => {
  const r = normalizeCheckInWeight({ weightStatus: "new", weight: "124.6", weightUnit: "LBS" })
  assert.deepEqual(r, { ok: true, fields: { weight: 124.6, weightUnit: "LBS", weightStatus: "new" } })
})

test("a new weight with no value is refused", () => {
  assert.equal(normalizeCheckInWeight({ weightStatus: "new", weight: "" }).ok, false)
  assert.equal(normalizeCheckInWeight({ weightStatus: "new", weight: "abc" }).ok, false)
})

test("same as last time stores the reference and drops any weight sent", () => {
  const r = normalizeCheckInWeight({ weightStatus: "same", weight: 200, weightUnit: "KG", weightConfirmedFrom: from })
  assert.deepEqual(r, { ok: true, fields: { weightStatus: "same", weightConfirmedFrom: from } })
})

test("a malformed reference is left off but the choice is kept", () => {
  const r = normalizeCheckInWeight({ weightStatus: "same", weightConfirmedFrom: { lbs: 5, at: "x", source: "nope" } })
  assert.deepEqual(r, { ok: true, fields: { weightStatus: "same" } })
})

test("skipped stores nothing but the status", () => {
  const r = normalizeCheckInWeight({ weightStatus: "skipped", weight: 130, weightUnit: "LBS", weightConfirmedFrom: from })
  assert.deepEqual(r, { ok: true, fields: { weightStatus: "skipped" } })
})

test("an unknown status is refused", () => {
  assert.equal(normalizeCheckInWeight({ weightStatus: "guess", weight: 130 }).ok, false)
})

test("old clients without a status keep the old behaviour", () => {
  assert.deepEqual(normalizeCheckInWeight({ weight: "130", weightUnit: "LBS" }), { ok: true, fields: { weight: 130, weightUnit: "LBS" } })
  assert.deepEqual(normalizeCheckInWeight({ weightUnit: "LBS" }), { ok: true, fields: { weightUnit: "LBS" } })
})

test("hunger accepts only the four answers", () => {
  assert.equal(parseHunger("some-days"), "some-days")
  assert.equal(parseHunger("starving"), undefined)
  assert.equal(parseHunger(3), undefined)
  assert.equal(hungerLabel("less"), "Less hungry than usual")
  assert.equal(hungerLabel(undefined), null)
})

test("the weight line covers new, same, skipped and old check-ins", () => {
  assert.equal(checkInWeightLine({ weight: 124.6, weightUnit: "LBS", weightStatus: "new" }), "124.6 lb")
  assert.equal(checkInWeightLine({ weightStatus: "same", weightConfirmedFrom: from }), "Same as last time (125 lb from Nov 8)")
  assert.equal(checkInWeightLine({ weightStatus: "same" }), "Same as last time")
  assert.equal(checkInWeightLine({ weightStatus: "skipped" }), "Skipped this week")
  assert.equal(checkInWeightLine({ weight: 60, weightUnit: "KG" }), "60 kg")
  assert.equal(checkInWeightLine({}), null)
})
