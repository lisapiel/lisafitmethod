import type { CoachingClientRecord } from "./authTokens"

// Nutrition goal enum. `"recomp"` was added when the four goals were split
// apart. Existing records may still hold the legacy three values — they must
// continue to work exactly as before. See resolveMacrosFor for the fallback.
export type NutritionGoal = "fat-loss" | "recomp" | "maintain" | "muscle-gain"
export type Sex = "male" | "female"

// Activity multipliers applied to Mifflin–St Jeor BMR to estimate TDEE.
//
// Values were tuned down (Oct 2026) from the previous 1.20/1.35/1.50/1.65/1.80
// scale because the old numbers consistently over-estimated real-world energy
// expenditure for coaching clients — self-reported activity is a known over-
// estimator, and when the recomp goal multiplied by a generous activity
// multiplier produced "maintenance" targets, real clients did not lose fat.
// The current scale sits in the conservative end of the practitioner range
// (1.2–1.9) that still accounts for differences in training density and
// non-exercise activity. Legacy stored values from the previous scale are
// re-mapped at compute time via `canonicalActivityLevel` so existing clients
// pick up the new semantics without record modification.
export const ACTIVITY_LEVELS = [
  { value: 1.20, key: "sedentary", label: "Sedentary",         desc: "Mostly seated lifestyle, little structured exercise." },
  { value: 1.30, key: "light",     label: "Lightly Active",    desc: "Mostly seated/light daily activity + ~1–3 training sessions/week." },
  { value: 1.42, key: "moderate",  label: "Moderately Active", desc: "Regular movement + ~3–5 training sessions/week." },
  { value: 1.55, key: "active",    label: "Very Active",       desc: "Training ~5–6 days/week and/or a physically active lifestyle or job." },
  { value: 1.70, key: "athlete",   label: "Highly Active",     desc: "Hard/frequent training plus a very active lifestyle or job." },
] as const

// Calorie multiplier per goal. Multiplicative (not fixed ± kcal), so a
// smaller client gets a smaller absolute deficit/surplus in kcal terms.
//
// Oct 2026 recalibration — in particular, `recomp` no longer equals
// maintenance. A client who selects "Body Recomposition" wants to see
// gradual fat loss while retaining/building muscle; if they wanted pure
// maintenance they'd pick `maintain`. The previous recomp = 1.00 was the
// single biggest reason real coaching clients were being prescribed
// numbers that worked against the goal they chose.
const GOAL_CALORIE_MULTIPLIER: Record<NutritionGoal, number> = {
  "fat-loss":    0.85, // ~15% deficit — supports steady loss while preserving training quality
  "recomp":      0.93, // ~7% deficit — mild but non-zero; recomp works at a slight deficit
  "maintain":    1.00, // true maintenance
  "muscle-gain": 1.08, // ~8% surplus — controlled starting surplus
}

// Protein g per kg of body weight.
//
// Oct 2026 recalibration — pulled down from 2.0/2.0/1.8/1.8 to 1.8/1.8/1.6/1.8.
// The old 2.0 g/kg of *total* body weight produced inflated protein targets
// for heavier clients carrying noticeable body fat (e.g. a 230 lb client was
// being prescribed ~210 g protein, more than their lean tissue actually
// needs). 1.8 g/kg across the fat-loss/recomp/muscle-gain goals still
// comfortably exceeds the research minimum (~1.6 g/kg) for muscle
// retention and growth in resistance-trained adults. Maintenance is slightly
// lower (1.6 g/kg) because the goal doesn't require maximizing muscle
// synthesis. If we later add a body-composition input, protein can scale
// off estimated lean body mass instead of total weight.
const GOAL_PROTEIN_G_PER_KG: Record<NutritionGoal, number> = {
  "fat-loss":    1.8,
  "recomp":      1.8,
  "maintain":    1.6,
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
  // Canonicalize the stored activityLevel at compute time. If a client was
  // seeded under the pre-Oct-2026 scale (1.35/1.50/1.65/1.80) or the even
  // older 5-level scale (1.375/1.55/1.725/1.9), their stored value is remapped
  // to the current scale's semantically-equivalent multiplier so the new
  // formula applies to them without us rewriting their record. New sign-ups
  // save current-scale values directly.
  const activity = canonicalActivityLevel(client.activityLevel) ?? client.activityLevel
  const tdee = computeTDEE(bmr, activity)
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
  "recomp":      { label: "Body Recomposition", desc: "Build muscle while gradually reducing body fat using a small calorie deficit. Expect slow, steady recomposition rather than fast scale change." },
  "maintain":    { label: "Maintain",           desc: "Maintain your current body weight while supporting training and recovery." },
  "muscle-gain": { label: "Muscle Gain",        desc: "Support muscle growth with a small, controlled calorie surplus." },
}

// Legacy-activity remap used both by `resolveMacrosFor` (so compute-time
// uses the current scale regardless of what's stored) and by the setup
// form (so a returning client sees the right button pre-selected).
// Maps:
//   - Pre-Oct 2026 scale 1.35 / 1.50 / 1.65 / 1.80 → current 1.30 / 1.42 / 1.55 / 1.70
//   - Pre-recalibration 5-level scale 1.375 / 1.55 / 1.725 / 1.9 → current
//     equivalent (label-matched, not nearest-numeric).
// Preserves client intent: whichever label they picked, they end up on the
// current-scale multiplier for that same label. Never rewrites the database;
// legacy values stay on disk until the client re-saves the setup form.
const LEGACY_ACTIVITY_MAP: Record<string, number> = {
  // Pre-recalibration 5-level scale (very old)
  "1.375": 1.30,
  "1.55":  1.42,
  "1.725": 1.55,
  "1.9":   1.70,
  // Pre-Oct-2026 scale
  "1.35":  1.30,
  "1.50":  1.42,
  "1.65":  1.55,
  "1.80":  1.70,
  "1.5":   1.42, // tolerates stored values that dropped the trailing zero
  "1.8":   1.70,
}
export function canonicalActivityLevel(stored?: number): number | undefined {
  if (stored == null) return stored
  // Current-scale values stay as-is.
  if (ACTIVITY_LEVELS.some((a) => Math.abs(a.value - stored) < 0.001)) return stored
  const mapped = LEGACY_ACTIVITY_MAP[String(stored)]
  return mapped ?? stored
}
// Legacy export name kept so callers (setup form) don't break on the rename.
export const remapLegacyActivity = canonicalActivityLevel
