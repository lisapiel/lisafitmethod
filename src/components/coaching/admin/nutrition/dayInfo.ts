import type { NutritionLogRecord } from "@/lib/authTokens"
import type { DailyTotals } from "@/lib/nutritionAnalytics"
import { isRecovered } from "./format"
import type { DayInfo } from "./types"

export function buildDayInfo(dailies: DailyTotals[], logs: NutritionLogRecord[]): DayInfo[] {
  const byDay = new Map<string, NutritionLogRecord[]>()
  for (const l of logs) {
    const arr = byDay.get(l.date)
    if (arr) arr.push(l); else byDay.set(l.date, [l])
  }
  return dailies.map((totals) => {
    const entries = (byDay.get(totals.date) ?? []).slice().sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
    const hasRecovered = entries.some(isRecovered)
    const partial = totals.logged && !(totals.known.protein && totals.known.carbs && totals.known.fat)
    const snackCalories = entries.filter((e) => e.mealType === "snack").reduce((a, e) => a + (e.calories || 0), 0)
    return {
      totals,
      entries,
      hasRecovered,
      snackCalories,
      state: !totals.logged ? "empty" : hasRecovered ? "recovered" : partial ? "partial" : "logged",
    }
  })
}

export function withinCalorieRange(d: DailyTotals): boolean | null {
  if (!d.logged || !d.target || d.target.calories <= 0) return null
  return Math.abs(d.calories - d.target.calories) <= d.target.calories * 0.1
}

export function proteinReached(d: DailyTotals): boolean | null {
  if (!d.logged || !d.known.protein || !d.target || d.target.protein <= 0) return null
  return d.protein >= d.target.protein * 0.95
}

export function countKnown(values: Array<boolean | null>): { yes: number; of: number } {
  const known = values.filter((v): v is boolean => v !== null)
  return { yes: known.filter(Boolean).length, of: known.length }
}
