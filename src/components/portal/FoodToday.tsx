"use client"

import type { NutritionLogRecord } from "@/lib/authTokens"
import { calorieRange, type DailyTotals } from "@/lib/nutritionAnalytics"
import FoodRings, { type FoodMacroKey } from "./FoodRings"

type Target = { calories: number; protein: number; carbs: number; fat: number }

function macroInfo(logs: NutritionLogRecord[], totals: DailyTotals | null, k: FoodMacroKey) {
  const withIt = logs.filter((l) => typeof l[k] === "number").length
  if (logs.length === 0 || withIt === 0) return { value: null, note: "not logged" }
  if (!totals?.known[k]) return { value: null, note: `on ${withIt} of ${logs.length} entries` }
  return { value: totals[k], note: null }
}

export default function FoodToday({ logs, totals, target, setByLisa }: { logs: NutritionLogRecord[]; totals: DailyTotals | null; target: Target; setByLisa: boolean }) {
  const has = logs.length > 0
  const kcal = totals?.calories ?? 0
  const { low, high } = calorieRange(target.calories)
  const pct = Math.round((kcal / target.calories) * 100)
  const status = !has ? null
    : kcal > high ? { text: `${(kcal - target.calories).toLocaleString()} above today's target`, tone: "#7a4f14" }
    : kcal >= low ? { text: "Within your range", tone: "#3f6b45" }
    : { text: `${(target.calories - kcal).toLocaleString()} to go`, tone: "#57514b" }
  const macros: Array<{ k: FoodMacroKey; name: string; goal: string }> = [
    { k: "protein", name: "Protein", goal: "goal" },
    { k: "carbs", name: "Carbs", goal: "guide" },
    { k: "fat", name: "Fat", goal: "guide" },
  ]
  return (
    <FoodRings
      calories={{
        value: has ? kcal : null,
        target: target.calories,
        center: has ? kcal.toLocaleString() : "Nothing yet",
        sub: has ? `of ${target.calories.toLocaleString()} kcal · ${pct}%` : `target ${target.calories.toLocaleString()} kcal`,
        label: has ? `${kcal} of ${target.calories} calories today, ${pct} percent` : `Nothing logged today. Target ${target.calories} calories`,
      }}
      status={status}
      range={`Your range is ${low.toLocaleString()} to ${high.toLocaleString()} kcal · ${setByLisa ? "set by Lisa" : "starting estimate"}`}
      macros={macros.map((m) => {
        const info = macroInfo(logs, totals, m.k)
        const t = target[m.k]
        const p = info.value == null ? null : Math.round((info.value / t) * 100)
        const left = m.k === "protein" && info.value != null && info.value < t ? `${t - info.value} g to go` : null
        return {
          k: m.k, name: m.name, value: info.value, target: t,
          center: p == null ? "–" : `${p}%`,
          detail: info.value == null ? info.note : `${info.value} of ${t} g`,
          foot: left ?? m.goal,
          label: info.value == null ? `${m.name} ${info.note}` : `${m.name} ${info.value} of ${t} grams, ${p} percent`,
        }
      })}
    />
  )
}
