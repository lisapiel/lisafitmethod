import type { DailyTotals } from "@/lib/nutritionAnalytics"
import type { NutritionLogRecord } from "@/lib/authTokens"

export type AdminCheckIn = {
  id?: string
  clientEmail?: string
  submittedAt?: string
  weight?: number
  weightUnit?: string
  measurementSnapshot?: string
}

export type AdminSnapshot = {
  id?: string
  clientEmail?: string
  snapshotDate?: string
  weight?: number
  weightUnit?: string
  waist?: number
  hips?: number
  chest?: number
  arm?: number
  thigh?: number
  glutes?: number
  customMeasurements?: string
}

export type Macros = { calories: number; protein: number; carbs: number; fat: number }

export type WeighInEstimate = { weighIn: { at: string; lbs: number }; macros: Macros }

export type DayState = "logged" | "recovered" | "partial" | "empty"

export type DayInfo = {
  totals: DailyTotals
  entries: NutritionLogRecord[]
  state: DayState
  snackCalories: number
  hasRecovered: boolean
}

export type TargetChange = {
  id: string
  changedAt: string
  changedBy: string
  kind: "set-custom" | "back-to-automatic"
  previous: Macros & { automatic: boolean }
  next: Macros & { automatic: boolean }
  reason: string
}

export type RecoveryMessage = { id: string; sentAt: string; body: string }

export type Recovery = {
  messageId: string
  date: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  status: "active" | "undone"
  confirmedAt: string
  clientFlag?: { note: string; at: string }
}
