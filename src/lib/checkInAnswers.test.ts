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

import { FORM_FEEDBACK_MAX, NUTRITION_NOTE_MAX, hasFormReviewVideos, parseFormFeedback, parseNutritionNote } from "./checkInAnswers"

test("the nutrition note is optional, trimmed and capped at 1,000 characters", () => {
  assert.deepEqual(parseNutritionNote(undefined), { ok: true })
  assert.deepEqual(parseNutritionNote(null), { ok: true })
  assert.deepEqual(parseNutritionNote("   "), { ok: true })
  assert.deepEqual(parseNutritionNote("  Weekends were hard.  "), { ok: true, value: "Weekends were hard." })
  assert.deepEqual(parseNutritionNote(` ${"a".repeat(NUTRITION_NOTE_MAX)} `), { ok: true, value: "a".repeat(NUTRITION_NOTE_MAX) })
  assert.equal(parseNutritionNote("a".repeat(NUTRITION_NOTE_MAX + 1)).ok, false)
  assert.equal(parseNutritionNote(42).ok, false)
})

test("form feedback is kept only for a check-in with videos, trimmed and length-checked", () => {
  assert.deepEqual(parseFormFeedback("  Keep your chest up.  ", true), { ok: true, value: "Keep your chest up." })
  assert.deepEqual(parseFormFeedback("Keep your chest up.", false), { ok: true, value: "" })
  assert.deepEqual(parseFormFeedback(undefined, true), { ok: true, value: "" })
  assert.equal(parseFormFeedback("a".repeat(FORM_FEEDBACK_MAX + 1), true).ok, false)
  assert.equal(parseFormFeedback({ text: "x" }, true).ok, false)
})

test("a form-review request counts only when it has a video", () => {
  const key = "media/coaching-form-reviews/sub/v.mp4"
  assert.equal(hasFormReviewVideos(undefined), false)
  assert.equal(hasFormReviewVideos(""), false)
  assert.equal(hasFormReviewVideos("{bad"), false)
  assert.equal(hasFormReviewVideos(JSON.stringify([{ exercise: "Squat", note: "depth", videoKeys: [] }])), false)
  assert.equal(hasFormReviewVideos(JSON.stringify([{ exercise: "Squat", note: "", videoKeys: [key] }])), true)
  assert.equal(hasFormReviewVideos([{ exercise: "Row", videoKeys: [key] }]), true)
  assert.equal(hasFormReviewVideos([{ exercise: "Row" }]), false)
})
