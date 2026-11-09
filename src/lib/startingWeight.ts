import { isPlausibleWeightLbs, resolveMacrosFor } from "./nutrition"
import type { CoachingClientRecord } from "./authTokens"
import { toLbs, type WeightUnit } from "./weight"
import type { WeightReading } from "./weightHistory"

// The starting weight is a profile value in pounds, set once at setup. Only
// the coach corrects it afterwards, and every correction is recorded.

export const STARTING_WEIGHT_MIN_LBS = 50
export const STARTING_WEIGHT_MAX_LBS = 700
export const STARTING_WEIGHT_REASON_MAX = 300

export interface MacroSet { calories: number; protein: number; carbs: number; fat: number }

export interface StartingWeightChangeRecord {
  id: string
  clientEmail: string
  previous: number | null
  next: number
  unit: WeightUnit
  entered: number
  reason: string
  changedBy: string
  changedAt: string
  // Only for clients on the automatic estimate, whose estimate is worked out
  // from this weight, so the history shows what that correction moved.
  automaticEstimate?: { previous: MacroSet | null; next: MacroSet | null }
}

export type StartingWeightInput =
  | { ok: true; lbs: number; unit: WeightUnit; entered: number; reason: string }
  | { ok: false; error: string }

export function roundLbs(lbs: number): number {
  return Math.round(lbs * 10) / 10
}

export function validateStartingWeightChange(input: { value: unknown; unit?: unknown; reason: unknown }): StartingWeightInput {
  const unit: WeightUnit = input.unit === "KG" || input.unit === "kg" ? "KG" : "LBS"
  const raw = typeof input.value === "string" ? input.value.trim() : input.value
  const entered = typeof raw === "number" ? raw : typeof raw === "string" && raw !== "" ? Number(raw) : NaN
  if (!Number.isFinite(entered) || entered <= 0) {
    return { ok: false, error: "Enter the corrected starting weight as a number." }
  }
  const lbs = toLbs(entered, unit)
  if (lbs == null || lbs < STARTING_WEIGHT_MIN_LBS || lbs > STARTING_WEIGHT_MAX_LBS) {
    return { ok: false, error: `The starting weight needs to be between ${STARTING_WEIGHT_MIN_LBS} and ${STARTING_WEIGHT_MAX_LBS} lb.` }
  }
  const reason = typeof input.reason === "string" ? input.reason.trim() : ""
  if (reason.length < 3) {
    return { ok: false, error: "Add a short reason for the correction. It's kept in the starting weight history." }
  }
  if (reason.length > STARTING_WEIGHT_REASON_MAX) {
    return { ok: false, error: `Keep the reason under ${STARTING_WEIGHT_REASON_MAX} characters.` }
  }
  return { ok: true, lbs: roundLbs(lbs), unit, entered, reason }
}

export function sortNewestFirst<T extends { changedAt: string }>(changes: T[]): T[] {
  return [...changes].sort((a, b) => b.changedAt.localeCompare(a.changedAt))
}

type EstimateClient = Pick<CoachingClientRecord, "customMacros" | "sex" | "age" | "heightInches" | "activityLevel" | "nutritionGoal" | "startingWeight">

function macroSet(m: MacroSet | null | undefined): MacroSet | null {
  return m ? { calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat } : null
}

export function automaticEstimate(client: EstimateClient, weightLbs?: number): MacroSet | null {
  return macroSet(resolveMacrosFor({ ...client, customMacros: undefined }, weightLbs))
}

export function isOnAutomaticEstimate(client: EstimateClient): boolean {
  return resolveMacrosFor(client)?.source !== "override"
}

// Coach decision support only: what the automatic estimate would be at the
// latest weigh-in. Nothing here changes a client's target.
export function estimateAtLatestWeighIn(client: EstimateClient, history: WeightReading[]): { weighIn: WeightReading; macros: MacroSet } | null {
  if (!isOnAutomaticEstimate(client)) return null
  const latest = history[history.length - 1]
  const start = client.startingWeight
  if (!latest || start == null || !isPlausibleWeightLbs(latest.lbs)) return null
  if (roundLbs(latest.lbs) === roundLbs(start)) return null
  const macros = automaticEstimate(client, latest.lbs)
  return macros ? { weighIn: latest, macros } : null
}
