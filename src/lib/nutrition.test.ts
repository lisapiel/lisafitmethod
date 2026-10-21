// Pure-function tests for the canonical nutrition calculator.
// Run with: npx tsx src/lib/nutrition.test.ts
// No framework — just assert() + console output. Exits non-zero on failure.

import assert from "node:assert/strict"
import {
  ACTIVITY_LEVELS,
  GOAL_META,
  MIN_CALORIE_FLOOR,
  computeBMR,
  computeTDEE,
  computeMacros,
  resolveMacrosFor,
  lbsToKg,
  remapLegacyActivity,
  type NutritionGoal,
} from "./nutrition"

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  ✗ ${name}\n      ${msg}`)
    failed++
  }
}

function section(name: string) { console.log(`\n${name}`) }

// Helper: run the full BMR → TDEE → macros pipeline
function targetFor(profile: { sex: "male" | "female"; weightLbs: number; heightInches: number; age: number; activity: number; goal: NutritionGoal }) {
  const bmr = computeBMR({ sex: profile.sex, weightLbs: profile.weightLbs, heightInches: profile.heightInches, age: profile.age })
  const tdee = computeTDEE(bmr, profile.activity)
  return { bmr, tdee, ...computeMacros({ tdee, goal: profile.goal, weightLbs: profile.weightLbs }) }
}

// Approximate equality (some computations carry small floating drift)
function near(actual: number, expected: number, tol: number, note = "") {
  assert.ok(Math.abs(actual - expected) <= tol, `${note} expected ~${expected} (±${tol}), got ${actual}`)
}

section("Mifflin–St Jeor BMR")
test("Male, 180 lb, 5'10\", 30", () => {
  const bmr = computeBMR({ sex: "male", weightLbs: 180, heightInches: 70, age: 30 })
  // 10*81.65 + 6.25*177.8 - 5*30 + 5 = 816.5 + 1111.25 - 150 + 5 = 1782.75
  near(bmr, 1782.75, 1)
})
test("Female, 125 lb, 5'6\", 34", () => {
  const bmr = computeBMR({ sex: "female", weightLbs: 125, heightInches: 66, age: 34 })
  // 10*56.699 + 6.25*167.64 - 5*34 - 161 = 566.99 + 1047.75 - 170 - 161 = 1283.74
  near(bmr, 1283.74, 1)
})

section("Activity factors")
test("All five factors present with expected values", () => {
  const values = ACTIVITY_LEVELS.map((a) => a.value)
  // Oct 2026 recalibration: the scale was compressed so the middle bands stop
  // over-predicting burn for desk-bound clients who train a few times a week.
  assert.deepEqual(values, [1.20, 1.30, 1.42, 1.55, 1.70])
})
test("TDEE strictly increases across activity levels", () => {
  const bmr = 1500
  const tdees = ACTIVITY_LEVELS.map((a) => computeTDEE(bmr, a.value))
  for (let i = 1; i < tdees.length; i++) {
    assert.ok(tdees[i] > tdees[i - 1], `TDEE not increasing at index ${i}: ${tdees}`)
  }
})

section("Goal calorie multipliers")
test("Fat Loss < Recomp < Maintain < Muscle Gain (at same TDEE)", () => {
  const w = 150
  const tdee = 2200
  const fl = computeMacros({ tdee, goal: "fat-loss", weightLbs: w })
  const rc = computeMacros({ tdee, goal: "recomp", weightLbs: w })
  const mt = computeMacros({ tdee, goal: "maintain", weightLbs: w })
  const mg = computeMacros({ tdee, goal: "muscle-gain", weightLbs: w })
  // Recomp is a slight deficit (0.93) since the recalibration, so it no longer
  // coincides with maintenance. At tdee 2200: 1870 / 2050 / 2200 / 2380.
  assert.ok(fl.calories < rc.calories, `fat-loss ${fl.calories} !< recomp ${rc.calories}`)
  assert.ok(rc.calories < mt.calories, `recomp ${rc.calories} !< maintain ${mt.calories}`)
  assert.ok(mt.calories < mg.calories, `maintain ${mt.calories} !< muscle-gain ${mg.calories}`)
})

section("Macro / calorie reconciliation (must be reasonably close)")
test("Every goal reconciles to within ±20 kcal for a typical profile", () => {
  const profile = { sex: "female" as const, weightLbs: 150, heightInches: 65, age: 35, activity: 1.42 }
  for (const goal of ["fat-loss", "recomp", "maintain", "muscle-gain"] as NutritionGoal[]) {
    const r = targetFor({ ...profile, goal })
    const macroCals = r.protein * 4 + r.carbs * 4 + r.fat * 9
    near(macroCals, r.calories, 20, `${goal}:`)
  }
})
test("Carbs are never negative even on tiny profiles", () => {
  const r = targetFor({ sex: "female", weightLbs: 105, heightInches: 60, age: 55, activity: 1.20, goal: "fat-loss" })
  assert.ok(r.carbs >= 0, `carbs=${r.carbs}`)
})

section("Low-calorie guardrail")
test("A tiny profile with fat-loss clamps at MIN_CALORIE_FLOOR and sets belowGuard", () => {
  // Force TDEE * 0.85 < 1200. tdee=1300 gives 1105, so the floor must bite.
  const r = computeMacros({ tdee: 1300, goal: "fat-loss", weightLbs: 100 })
  assert.equal(r.calories, MIN_CALORIE_FLOOR)
  assert.equal(r.belowGuard, true)
})
test("A comfortable profile never trips belowGuard", () => {
  const r = computeMacros({ tdee: 2000, goal: "fat-loss", weightLbs: 150 })
  assert.equal(r.belowGuard, false)
  assert.ok(r.calories > MIN_CALORIE_FLOOR)
})

section("Lisa's acceptance profile — 125 lb / 5'6\" / 34 / female / lightly active")
// "Lightly active" is 1.30 on the current scale; 1.35 was its pre-Oct-2026
// value and is now only accepted as legacy stored data.
const LISA = { sex: "female" as const, weightLbs: 125, heightInches: 66, age: 34, activity: 1.30 }
// BMR 1283.74 (checked above) * 1.30 = 1668.86 maintenance.
test("Fat Loss lands in the 1380–1460 kcal ballpark", () => {
  const r = targetFor({ ...LISA, goal: "fat-loss" })
  // 1668.86 * 0.85 = 1418.5, rounded to the nearest 10 = 1420.
  assert.ok(r.calories >= 1380 && r.calories <= 1460, `Fat Loss calories = ${r.calories}, expected 1380–1460`)
  // protein 56.699 kg * 1.8 = 102.1 -> 100; fat 1420 * 0.30 / 9 = 47.3 -> 45;
  // carbs (1420 - 400 - 405) / 4 = 153.8 -> 155.
  near(r.protein, 100, 5, "protein:")
  near(r.fat, 45, 5, "fat:")
  near(r.carbs, 155, 15, "carbs:")
})
test("Recomp sits between fat-loss and maintenance", () => {
  const fl = targetFor({ ...LISA, goal: "fat-loss" })
  const rc = targetFor({ ...LISA, goal: "recomp" })
  const mt = targetFor({ ...LISA, goal: "maintain" })
  // 1668.86 * 0.93 = 1552 -> 1550, i.e. a mild deficit rather than maintenance.
  assert.ok(rc.calories > fl.calories, `${rc.calories} !> ${fl.calories}`)
  assert.ok(rc.calories < mt.calories, `${rc.calories} !< ${mt.calories}`)
  assert.ok(rc.calories >= 1510 && rc.calories <= 1590, `Recomp = ${rc.calories}`)
})
test("Maintain lands on estimated maintenance, above Recomp", () => {
  const rc = targetFor({ ...LISA, goal: "recomp" })
  const mt = targetFor({ ...LISA, goal: "maintain" })
  // 1668.86 * 1.00 = 1668.9 -> 1670.
  assert.ok(mt.calories > rc.calories, `${mt.calories} !> ${rc.calories}`)
  near(mt.calories, 1670, 10, "maintain:")
})
test("Muscle Gain is a small surplus (~8%), above maintenance", () => {
  const mt = targetFor({ ...LISA, goal: "maintain" })
  const mg = targetFor({ ...LISA, goal: "muscle-gain" })
  assert.ok(mg.calories > mt.calories, `${mg.calories} !> ${mt.calories}`)
  assert.ok(mg.calories <= Math.round(mt.calories * 1.10), `Surplus too large: ${mg.calories} vs ${mt.calories}`)
})

section("Gino regression reference — 210 lb coaching client, fat loss")
test("210 lb fat-loss client hits 2720 kcal / 170P / 310C / 90F", () => {
  // Lisa's standing acceptance figures for Gino's original profile, with no
  // custom override in play. 2720 at the fat-loss multiplier implies an
  // estimated TDEE of 2720 / 0.85 = 3200.
  const r = computeMacros({ tdee: 3200, goal: "fat-loss", weightLbs: 210 })
  // 3200 * 0.85 = 2720 exactly.
  assert.equal(r.calories, 2720)
  // protein 95.254 kg * 1.8 = 171.5 -> 170
  assert.equal(r.protein, 170)
  // fat 2720 * 0.30 / 9 = 90.7 -> 90
  assert.equal(r.fat, 90)
  // carbs (2720 - 680 - 810) / 4 = 307.5 -> 310
  assert.equal(r.carbs, 310)
  assert.equal(r.belowGuard, false)
})

section("Representative body types — no absurd outputs")
const PROFILES = [
  { name: "Small woman, 108 lb, 5'2\", 42, moderate",   sex: "female" as const, weightLbs: 108, heightInches: 62, age: 42, activity: 1.42 },
  { name: "Average woman, 150 lb, 5'5\", 30, light",    sex: "female" as const, weightLbs: 150, heightInches: 65, age: 30, activity: 1.30 },
  { name: "Larger woman, 210 lb, 5'8\", 45, sedentary", sex: "female" as const, weightLbs: 210, heightInches: 68, age: 45, activity: 1.20 },
  { name: "Small man, 150 lb, 5'7\", 28, moderate",     sex: "male"   as const, weightLbs: 150, heightInches: 67, age: 28, activity: 1.42 },
  { name: "Average man, 185 lb, 5'11\", 35, active",    sex: "male"   as const, weightLbs: 185, heightInches: 71, age: 35, activity: 1.55 },
  { name: "Larger man, 240 lb, 6'2\", 50, light",       sex: "male"   as const, weightLbs: 240, heightInches: 74, age: 50, activity: 1.30 },
]
for (const p of PROFILES) {
  test(p.name, () => {
    for (const goal of ["fat-loss", "recomp", "maintain", "muscle-gain"] as NutritionGoal[]) {
      const r = targetFor({ ...p, goal })
      assert.ok(r.calories >= MIN_CALORIE_FLOOR, `${goal}: calories ${r.calories} < floor`)
      assert.ok(r.calories <= 5000, `${goal}: calories ${r.calories} absurdly high`)
      assert.ok(r.protein > 0 && r.protein <= r.calories / 4, `${goal}: protein sanity`)
      assert.ok(r.fat > 0 && r.fat <= r.calories / 9, `${goal}: fat sanity`)
      assert.ok(r.carbs >= 0, `${goal}: negative carbs`)
      const macroCals = r.protein * 4 + r.carbs * 4 + r.fat * 9
      assert.ok(Math.abs(macroCals - r.calories) <= 20, `${goal}: macros ${macroCals} vs calories ${r.calories}`)
    }
  })
}

section("Adjacent-goal continuity (no cliffs)")
test("Ordering holds for every representative profile", () => {
  for (const p of PROFILES) {
    const fl = targetFor({ ...p, goal: "fat-loss" }).calories
    const rc = targetFor({ ...p, goal: "recomp" }).calories
    const mt = targetFor({ ...p, goal: "maintain" }).calories
    const mg = targetFor({ ...p, goal: "muscle-gain" }).calories
    // fl <= rc <= mt <= mg (equality allowed only where the guardrail clamps)
    assert.ok(fl <= rc, `${p.name}: fat-loss ${fl} > recomp ${rc}`)
    assert.ok(rc <= mt, `${p.name}: recomp ${rc} > maintain ${mt}`)
    assert.ok(mt <= mg, `${p.name}: maintain ${mt} > muscle-gain ${mg}`)
  }
})

section("Backward compatibility")
test("Legacy nutritionGoal: 'maintain' still resolves as maintenance", () => {
  const r = resolveMacrosFor({
    customMacros: undefined,
    sex: "female", age: 34, heightInches: 66, activityLevel: 1.35,
    nutritionGoal: "maintain", startingWeight: 125,
  })
  assert.ok(r != null)
  assert.equal(r!.source, "auto")
  // resolveMacrosFor canonicalises stored activity first, so the equivalent
  // direct call uses 1.30 (the current "lightly active" value), not the
  // legacy 1.35 that is on disk.
  const direct = targetFor({ sex: "female", weightLbs: 125, heightInches: 66, age: 34, activity: 1.30, goal: "maintain" })
  assert.equal(r!.calories, direct.calories)
})
test("resolveMacrosFor falls back to 'maintain' when nutritionGoal is undefined", () => {
  const r = resolveMacrosFor({
    customMacros: undefined,
    sex: "male", age: 40, heightInches: 70, activityLevel: 1.50,
    nutritionGoal: undefined, startingWeight: 180,
  })
  assert.ok(r != null)
  // Legacy 1.50 canonicalises to the current "moderate" value, 1.42.
  const direct = targetFor({ sex: "male", weightLbs: 180, heightInches: 70, age: 40, activity: 1.42, goal: "maintain" })
  assert.equal(r!.calories, direct.calories)
})
test("Legacy activityLevel 1.375 still yields a valid auto calculation", () => {
  const r = resolveMacrosFor({
    customMacros: undefined,
    sex: "female", age: 34, heightInches: 66, activityLevel: 1.375,
    nutritionGoal: "fat-loss", startingWeight: 125,
  })
  assert.ok(r != null)
  assert.ok(r!.calories >= MIN_CALORIE_FLOOR)
  // Different from a current-scale 1.30 result is fine; old data still works.
})
test("remapLegacyActivity maps legacy values onto the current scale by label", () => {
  // Very old 5-level scale -> current equivalent for the same label.
  assert.equal(remapLegacyActivity(1.375), 1.30)
  assert.equal(remapLegacyActivity(1.725), 1.55)
  assert.equal(remapLegacyActivity(1.9), 1.70)
  // 1.55 is ambiguous: it was "moderate" on the old 5-level scale and is
  // "active" on the current one. canonicalActivityLevel checks the current
  // scale first, so a stored 1.55 is read as "active" and passes through
  // untouched, which shadows the 1.55 -> 1.42 entry in LEGACY_ACTIVITY_MAP.
  // Asserted as the engine actually behaves. Flagged for Lisa rather than
  // resolved here, because either reading changes live client targets.
  assert.equal(remapLegacyActivity(1.55), 1.55)
  // Pre-Oct-2026 scale -> current equivalent for the same label.
  assert.equal(remapLegacyActivity(1.35), 1.30)
  assert.equal(remapLegacyActivity(1.50), 1.42)
  assert.equal(remapLegacyActivity(1.65), 1.55)
  assert.equal(remapLegacyActivity(1.80), 1.70)
  // Already-canonical values pass through unchanged
  assert.equal(remapLegacyActivity(1.30), 1.30)
  assert.equal(remapLegacyActivity(1.42), 1.42)
  assert.equal(remapLegacyActivity(undefined), undefined)
})

section("Manual override preservation")
test("customMacros wins over any auto calculation", () => {
  const r = resolveMacrosFor({
    customMacros: { calories: 1800, protein: 140, carbs: 180, fat: 55, updatedAt: "2026-08-01T00:00:00Z" },
    sex: "female", age: 34, heightInches: 66, activityLevel: 1.35,
    nutritionGoal: "fat-loss", startingWeight: 125,
  })
  assert.ok(r != null)
  assert.equal(r!.source, "override")
  assert.equal(r!.calories, 1800)
  assert.equal(r!.protein, 140)
  assert.equal(r!.carbs, 180)
  assert.equal(r!.fat, 55)
})
test("Partial customMacros (missing one field) falls back to auto", () => {
  const r = resolveMacrosFor({
    customMacros: { calories: 1800, protein: 140, carbs: undefined, fat: 55, updatedAt: "2026-08-01T00:00:00Z" },
    sex: "female", age: 34, heightInches: 66, activityLevel: 1.35,
    nutritionGoal: "fat-loss", startingWeight: 125,
  })
  assert.ok(r != null)
  assert.equal(r!.source, "auto")
})

section("Insufficient data")
test("Returns null when weight is missing", () => {
  const r = resolveMacrosFor({
    customMacros: undefined,
    sex: "female", age: 34, heightInches: 66, activityLevel: 1.35,
    nutritionGoal: "fat-loss", startingWeight: undefined,
  })
  assert.equal(r, null)
})

section("Sanity: unit conversions")
test("lbsToKg is correct at 100 lb", () => { near(lbsToKg(100), 45.36, 0.01) })

section("Goal metadata")
test("All four goals have label + desc", () => {
  const goals: NutritionGoal[] = ["fat-loss", "recomp", "maintain", "muscle-gain"]
  for (const g of goals) {
    assert.ok(GOAL_META[g].label.length > 0, `${g} missing label`)
    assert.ok(GOAL_META[g].desc.length > 0, `${g} missing desc`)
  }
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
