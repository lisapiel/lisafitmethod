import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveMacrosFor } from "./nutrition"
import { estimateAtLatestWeighIn, sortNewestFirst, validateStartingWeightChange } from "./startingWeight"
import { buildWeightHistory } from "./weightHistory"

// Expected numbers were worked out by hand from Mifflin-St Jeor:
// 128 lb: BMR 1260.6, x1.42 = 1790.1, x0.85 = 1521.5 -> 1520 kcal, protein 58.06 kg x1.8 = 104.5 -> 105 g,
//         fat 1520 x0.3 / 9 = 50.7 -> 50 g, carbs (1520 - 420 - 450) / 4 = 162.5 -> 165 g.
// 125 lb: BMR 1247.0, x1.42 = 1770.7, x0.85 = 1505.1 -> 1510 kcal, protein 56.70 x1.8 = 102.1 -> 100 g,
//         fat 50 g, carbs (1510 - 400 - 450) / 4 = 165 g.
const AT_128 = { calories: 1520, protein: 105, carbs: 165, fat: 50 }
const AT_125 = { calories: 1510, protein: 100, carbs: 165, fat: 50 }
const client = { sex: "female" as const, age: 35, heightInches: 64, activityLevel: 1.42, nutritionGoal: "fat-loss" as const, startingWeight: 128 }
const macros = (m: { calories: number; protein: number; carbs: number; fat: number } | null) =>
  m && { calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat }

test("a reason is required and trimmed", () => {
  assert.equal(validateStartingWeightChange({ value: 125, reason: "" }).ok, false)
  assert.equal(validateStartingWeightChange({ value: 125, reason: "   " }).ok, false)
  assert.equal(validateStartingWeightChange({ value: 125 } as { value: number; reason: unknown }).ok, false)
  const r = validateStartingWeightChange({ value: 125, reason: "  Typo at setup  " })
  assert.ok(r.ok)
  assert.equal(r.ok && r.reason, "Typo at setup")
})

test("a reason over 300 characters is refused", () => {
  assert.equal(validateStartingWeightChange({ value: 125, reason: "x".repeat(301) }).ok, false)
  assert.equal(validateStartingWeightChange({ value: 125, reason: "x".repeat(300) }).ok, true)
})

test("the weight must be between 50 and 700 lb", () => {
  assert.equal(validateStartingWeightChange({ value: 49.9, reason: "Typo" }).ok, false)
  assert.equal(validateStartingWeightChange({ value: 50, reason: "Typo" }).ok, true)
  assert.equal(validateStartingWeightChange({ value: 700, reason: "Typo" }).ok, true)
  assert.equal(validateStartingWeightChange({ value: 701, reason: "Typo" }).ok, false)
  assert.equal(validateStartingWeightChange({ value: "abc", reason: "Typo" }).ok, false)
  assert.equal(validateStartingWeightChange({ value: "", reason: "Typo" }).ok, false)
  assert.equal(validateStartingWeightChange({ value: -5, reason: "Typo" }).ok, false)
})

test("kilograms are converted to pounds and the range is checked in pounds", () => {
  const r = validateStartingWeightChange({ value: "56.7", unit: "KG", reason: "Entered in kg" })
  assert.ok(r.ok)
  // 56.7 x 2.20462 = 125.0
  assert.equal(r.ok && r.lbs, 125)
  assert.equal(r.ok && r.unit, "KG")
  assert.equal(r.ok && r.entered, 56.7)
  // 320 kg is 705.5 lb, over the limit even though 320 is a valid pound value
  assert.equal(validateStartingWeightChange({ value: 320, unit: "KG", reason: "Typo" }).ok, false)
  assert.equal(validateStartingWeightChange({ value: 22, unit: "KG", reason: "Typo" }).ok, false)
})

test("history is listed newest first", () => {
  const sorted = sortNewestFirst([
    { id: "a", changedAt: "2026-11-01T10:00:00.000Z" },
    { id: "c", changedAt: "2026-11-09T10:00:00.000Z" },
    { id: "b", changedAt: "2026-11-05T10:00:00.000Z" },
  ])
  assert.deepEqual(sorted.map((c) => c.id), ["c", "b", "a"])
})

test("resolveMacros uses the current weight when given and the starting weight otherwise", () => {
  assert.deepEqual(macros(resolveMacrosFor(client)), AT_128)
  assert.deepEqual(macros(resolveMacrosFor(client, 125)), AT_125)
  assert.deepEqual(macros(resolveMacrosFor(client, undefined)), AT_128)
})

test("the estimate at the latest weigh-in leaves the effective target unchanged", () => {
  const before = JSON.stringify(resolveMacrosFor(client))
  const history = buildWeightHistory({ checkIns: [{ submittedAt: "2026-11-02T10:00:00Z", weight: 127 }], logged: [{ snapshotDate: "2026-11-09", weight: 125, weightUnit: "LBS" }] })
  const review = estimateAtLatestWeighIn(client, history)
  assert.equal(review?.weighIn.lbs, 125)
  assert.deepEqual(review?.macros, AT_125)
  assert.equal(JSON.stringify(resolveMacrosFor(client)), before)
  assert.deepEqual(macros(resolveMacrosFor(client)), AT_128)
})

test("no estimate is offered when the latest weigh-in matches the starting weight, there is none, or the target is custom", () => {
  const same = buildWeightHistory({ checkIns: [], logged: [{ snapshotDate: "2026-11-09", weight: 128 }] })
  assert.equal(estimateAtLatestWeighIn(client, same), null)
  assert.equal(estimateAtLatestWeighIn(client, []), null)
  const custom = { ...client, customMacros: { calories: 1800, protein: 120, carbs: 180, fat: 64, updatedAt: "2026-11-01T00:00:00Z" } }
  const moved = buildWeightHistory({ checkIns: [], logged: [{ snapshotDate: "2026-11-09", weight: 125 }] })
  assert.equal(estimateAtLatestWeighIn(custom, moved), null)
  assert.equal(resolveMacrosFor(custom)?.calories, 1800)
})

test("a kilogram weigh-in is compared in pounds", () => {
  const kg = buildWeightHistory({ checkIns: [], logged: [{ snapshotDate: "2026-11-09", weight: 56.7, weightUnit: "KG" }] })
  const review = estimateAtLatestWeighIn(client, kg)
  assert.equal(review && Math.round(review.weighIn.lbs), 125)
  assert.deepEqual(review?.macros, AT_125)
})
