import type { CoachingClientRecord } from "./authTokens"

export type NutritionGoal = "fat-loss" | "maintain" | "muscle-gain"
export type Sex = "male" | "female"

export const ACTIVITY_LEVELS = [
  { value: 1.2,   key: "sedentary", label: "Sedentary",       desc: "Little or no exercise, desk job." },
  { value: 1.375, key: "light",     label: "Lightly Active",  desc: "Light exercise 1–3 days/week." },
  { value: 1.55,  key: "moderate",  label: "Moderately Active", desc: "Moderate exercise 3–5 days/week." },
  { value: 1.725, key: "active",    label: "Very Active",     desc: "Hard training 6–7 days/week." },
  { value: 1.9,   key: "athlete",   label: "Extremely Active", desc: "Two-a-days or physical job + training." },
] as const

const GOAL_ADJUSTMENT: Record<NutritionGoal, number> = {
  "fat-loss": -400,
  "maintain": 0,
  "muscle-gain": 300,
}

const KG_PER_LB = 0.453592
const CM_PER_IN = 2.54

export function lbsToKg(lbs: number): number { return lbs * KG_PER_LB }
export function inchesToCm(inches: number): number { return inches * CM_PER_IN }

// Mifflin-St Jeor BMR
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

export function computeMacros({ tdee, goal, weightLbs }: {
  tdee: number; goal: NutritionGoal; weightLbs: number
}): { calories: number; protein: number; carbs: number; fat: number } {
  const calories = Math.round(tdee + GOAL_ADJUSTMENT[goal])
  const protein = Math.round(weightLbs * 1.0)         // 1 g/lb bodyweight
  const fat = Math.round(weightLbs * 0.35)            // 0.35 g/lb bodyweight
  const carbCals = Math.max(calories - protein * 4 - fat * 9, 0)
  const carbs = Math.round(carbCals / 4)
  return { calories, protein, carbs, fat }
}

// Resolves a client's macro target. Priority:
// 1. customMacros (coach override) → returned with source "override"
// 2. Auto-computed from body data + current weight → source "auto"
// 3. null if data insufficient
export function resolveMacrosFor(
  client: Pick<CoachingClientRecord, "customMacros" | "sex" | "age" | "heightInches" | "activityLevel" | "nutritionGoal" | "startingWeight">,
  currentWeightLbs?: number
): { calories: number; protein: number; carbs: number; fat: number; source: "override" | "auto" } | null {
  const c = client.customMacros
  if (c && c.calories != null && c.protein != null && c.carbs != null && c.fat != null) {
    return { calories: c.calories, protein: c.protein, carbs: c.carbs, fat: c.fat, source: "override" }
  }
  const weight = currentWeightLbs ?? client.startingWeight
  if (
    !client.sex || client.age == null || client.heightInches == null ||
    client.activityLevel == null || weight == null
  ) {
    return null
  }
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
