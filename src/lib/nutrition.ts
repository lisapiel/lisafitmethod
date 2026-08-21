import type { CoachingClientRecord } from "./authTokens"

// Nutrition goal enum. `"recomp"` was added when the four goals were split
// apart. Existing records may still hold the legacy three values — they must
// continue to work exactly as before. See resolveMacrosFor for the fallback.
export type NutritionGoal = "fat-loss" | "recomp" | "maintain" | "muscle-gain"
export type Sex = "male" | "female"

// Activity multipliers applied to Mifflin–St Jeor BMR to estimate TDEE.
// The values are starting estimates; a client can move up or down as real
// data comes in. Labels are short for the setup UI; the description explains
// both structured training AND daily lifestyle activity so a client picks
// correctly rather than only counting workouts.
export const ACTIVITY_LEVELS = [
  { value: 1.20, key: "sedentary", label: "Sedentary",         desc: "Mostly seated lifestyle, little structured exercise." },
  { value: 1.35, key: "light",     label: "Lightly Active",    desc: "Mostly seated/light daily activity + ~1–3 training sessions/week." },
  { value: 1.50, key: "moderate",  label: "Moderately Active", desc: "Regular movement + ~3–5 training sessions/week." },
  { value: 1.65, key: "active",    label: "Very Active",       desc: "Training ~5–6 days/week and/or a physically active lifestyle or job." },
  { value: 1.80, key: "athlete",   label: "Highly Active",     desc: "Hard/frequent training plus a very active lifestyle or job." },
] as const

// Calorie multiplier per goal. Multiplicative (not fixed ± kcal), so a
// smaller client gets a smaller absolute deficit/surplus in kcal terms.
const GOAL_CALORIE_MULTIPLIER: Record<NutritionGoal, number> = {
  "fat-loss": 0.88,     // ~12% deficit — conservative, supports adherence + strength
  "recomp": 1.00,       // approximately estimated maintenance
  "maintain": 1.00,     // approximately estimated maintenance
  "muscle-gain": 1.07,  // ~7% surplus — controlled starting surplus
}

// Protein g per kg of body weight. Fat loss and recomposition prioritize
// protein more heavily for muscle retention / body-composition change.
const GOAL_PROTEIN_G_PER_KG: Record<NutritionGoal, number> = {
  "fat-loss": 2.0,
  "recomp": 2.0,
  "maintain": 1.8,
  "muscle-gain": 1.8,
}

// Fat as a fraction of target calories. 30% sits comfortably inside the
// 20–35% general adult range and works for every goal.
const FAT_FRACTION_OF_CALORIES = 0.30

// Below this daily calorie target the automated calculator refuses to keep
// cutting. It clamps to the floor and flags belowGuard so the UI can show
// a subtle note that very low targets need individual review.
export const MIN_CALORIE_FLOOR = 1200

const KG_PER_LB = 0.453592
const CM_PER_IN = 2.54

// Sanity band for adult body weight in POUNDS. Anything outside this range
// almost certainly indicates a data-entry mistake (or a value stored as
// KG rather than LBS), which is exactly how absurd macro numbers get
// produced. Guardrails downstream return null rather than silently
// computing on garbage. Range is intentionally generous — covers the
// same 80–500 lb band the setup form already validates against.
export const MIN_WEIGHT_LBS = 60
export const MAX_WEIGHT_LBS = 500

export function isPlausibleWeightLbs(weightLbs: number | undefined | null): weightLbs is number {
  return typeof weightLbs === "number"
    && Number.isFinite(weightLbs)
    && weightLbs >= MIN_WEIGHT_LBS
    && weightLbs <= MAX_WEIGHT_LBS
}

export function lbsToKg(lbs: number): number { return lbs * KG_PER_LB }
export function inchesToCm(inches: number): number { return inches * CM_PER_IN }

// Round to nearest step (5g for macros, 10 kcal for calories).
function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

// Mifflin–St Jeor BMR
export function computeBMR({ sex, weightLbs, heightInches, age }: {
  sex: Sex; weightLbs: number; heightInches: number; age: number
}): number {
  const kg = lbsToKg(weightLbs)
  const cm = inchesToCm(heightInches)
  const base = 10 * kg + 6.25 * cm - 5 * age
  return sex === "male" ? base + 5 : base - 161
}

export function computeTDEE(bmr: number, activityMultiplier: number): number {
  return bmr * activityMultiplier
}

export interface MacroTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
  belowGuard: boolean
}

// Canonical macro calculator. Everything upstream of the UI funnels through
// this. Rounding rules: calories to nearest 10 kcal, protein/fat/carbs to
// nearest 5g. Carbs is the reconciliation macro — fills whatever calorie
// budget remains after protein and fat are chosen.
export function computeMacros({ tdee, goal, weightLbs }: {
  tdee: number; goal: NutritionGoal; weightLbs: number
}): MacroTargets {
  const rawCalories = tdee * GOAL_CALORIE_MULTIPLIER[goal]
  const belowGuard = rawCalories < MIN_CALORIE_FLOOR
  const calories = roundTo(Math.max(MIN_CALORIE_FLOOR, rawCalories), 10)

  const kg = lbsToKg(weightLbs)
  const protein = roundTo(kg * GOAL_PROTEIN_G_PER_KG[goal], 5)

  const fatCalories = calories * FAT_FRACTION_OF_CALORIES
  const fat = roundTo(fatCalories / 9, 5)

  const remaining = calories - protein * 4 - fat * 9
  const carbs = Math.max(0, roundTo(remaining / 4, 5))

  return { calories, protein, carbs, fat, belowGuard }
}

export interface ResolvedMacros extends MacroTargets {
  source: "override" | "auto"
}

// Resolves a client's macro target. Priority:
// 1. customMacros (coach/admin override) → returned with source "override"
// 2. Auto-computed from body data + current/starting weight → source "auto"
// 3. null if data insufficient
//
// The override path is important: it means changing the formula in this file
// does NOT overwrite any client that has a manually-set target. Only clients
// on the automatic formula see the new numbers.
//
// Legacy note: older client records used `"maintain"` for what is now called
// either "maintain" or "recomp". `nutritionGoal ?? "maintain"` preserves that
// so nobody's stored goal changes silently — Recomp is only chosen explicitly
// via the setup form.
export function resolveMacrosFor(
  client: Pick<CoachingClientRecord, "customMacros" | "sex" | "age" | "heightInches" | "activityLevel" | "nutritionGoal" | "startingWeight">,
  currentWeightLbs?: number
): ResolvedMacros | null {
  const c = client.customMacros
  if (c && c.calories != null && c.protein != null && c.carbs != null && c.fat != null) {
    return { calories: c.calories, protein: c.protein, carbs: c.carbs, fat: c.fat, belowGuard: false, source: "override" }
  }
  const weight = currentWeightLbs ?? client.startingWeight
  if (
    !client.sex || client.age == null || client.heightInches == null ||
    client.activityLevel == null || weight == null
  ) {
    return null
  }
  // Guardrail: weight must be a plausible adult-in-lbs value. If a value
  // was stored in kg by mistake, or a data entry landed outside the sane
  // band, refuse to compute rather than emit a bogus target (which is
  // how a client saw ~350 g protein). The UI already handles a null
  // return as "setup incomplete" and prompts the client to re-check.
  if (!isPlausibleWeightLbs(weight)) return null
  const goal: NutritionGoal = client.nutritionGoal ?? "maintain"
  const bmr = computeBMR({ sex: client.sex, weightLbs: weight, heightInches: client.heightInches, age: client.age })
  const tdee = computeTDEE(bmr, client.activityLevel)
  const macros = computeMacros({ tdee, goal, weightLbs: weight })
  return { ...macros, source: "auto" }
}

// Format helpers
export function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12)
  const remainder = inches % 12
  return `${feet}'${remainder}"`
}

export function activityLabel(multiplier?: number): string | null {
  if (multiplier == null) return null
  const found = ACTIVITY_LEVELS.find((a) => Math.abs(a.value - multiplier) < 0.001)
  return found?.label ?? null
}

// Client-facing goal labels + coaching copy. Kept alongside the numeric model
// so any surface that shows the goal picks up the same wording.
export const GOAL_META: Record<NutritionGoal, { label: string; desc: string }> = {
  "fat-loss":    { label: "Fat Loss",           desc: "Reduce body fat while supporting strength and muscle retention." },
  "recomp":      { label: "Body Recomposition", desc: "Build muscle while gradually reducing body fat. Scale weight may change very little." },
  "maintain":    { label: "Maintain",           desc: "Maintain your current body weight while supporting training and recovery." },
  "muscle-gain": { label: "Muscle Gain",        desc: "Support muscle growth with a small, controlled calorie surplus." },
}

// Maps legacy activityLevel values that a client record may still carry from
// the old five-level scale (1.375, 1.55, 1.725, 1.9) to the corresponding
// new value. Preserves label intent — legacy "Very Active" (1.725) maps to
// new "Very Active" (1.65), not to "Highly Active" — since the client's
// original label choice best represents their intent.
//
// Used ONLY by the setup form so a returning client sees the right button
// pre-selected. Never rewrites the database — the old value stays on disk
// until the client explicitly saves the form.
const LEGACY_ACTIVITY_MAP: Record<string, number> = {
  "1.375": 1.35, // Lightly Active → Lightly Active
  "1.55":  1.50, // Moderately Active → Moderately Active
  "1.725": 1.65, // Very Active → Very Active
  "1.9":   1.80, // Extremely Active → Highly Active
}
export function remapLegacyActivity(stored?: number): number | undefined {
  if (stored == null) return stored
  const legacy = LEGACY_ACTIVITY_MAP[String(stored)]
  return legacy ?? stored
}
