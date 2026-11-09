"use client"

import type { NutritionLogRecord } from "@/lib/authTokens"
import type { DailyTotals } from "@/lib/nutritionAnalytics"
import ProgressRing from "./ProgressRing"

type Target = { calories: number; protein: number; carbs: number; fat: number }
type Macro = "protein" | "carbs" | "fat"

const round10 = (n: number) => Math.round(n / 10) * 10

function macroInfo(logs: NutritionLogRecord[], totals: DailyTotals | null, k: Macro) {
  const withIt = logs.filter((l) => typeof l[k] === "number").length
  if (logs.length === 0 || withIt === 0) return { value: null, note: "not logged" }
  if (!totals?.known[k]) return { value: null, note: `on ${withIt} of ${logs.length} entries` }
  return { value: totals[k], note: null }
}

export default function FoodToday({ logs, totals, target, setByLisa }: { logs: NutritionLogRecord[]; totals: DailyTotals | null; target: Target; setByLisa: boolean }) {
  const has = logs.length > 0
  const kcal = totals?.calories ?? 0
  const low = round10(target.calories * 0.9)
  const high = round10(target.calories * 1.1)
  const pct = Math.round((kcal / target.calories) * 100)
  const status = !has ? null
    : kcal > high ? { text: `${(kcal - target.calories).toLocaleString()} above today's target`, tone: "#7a4f14" }
    : kcal >= low ? { text: "Within your range", tone: "#3f6b45" }
    : { text: `${(target.calories - kcal).toLocaleString()} to go`, tone: "#57514b" }
  const macros: Array<{ k: Macro; name: string; goal: string; tone: Macro }> = [
    { k: "protein", name: "Protein", goal: "goal", tone: "protein" },
    { k: "carbs", name: "Carbs", goal: "guide", tone: "carbs" },
    { k: "fat", name: "Fat", goal: "guide", tone: "fat" },
  ]
  return (
    <section className="pt-food-today" aria-label="Today's food">
      <ProgressRing
        size={208} stroke={16} tone="calories"
        state={has ? "logged" : "unknown"}
        value={has ? kcal : null} target={target.calories}
        center={has ? kcal.toLocaleString() : "Nothing yet"}
        sub={has ? `of ${target.calories.toLocaleString()} kcal · ${pct}%` : `target ${target.calories.toLocaleString()} kcal`}
        label={has ? `${kcal} of ${target.calories} calories today, ${pct} percent` : `Nothing logged today. Target ${target.calories} calories`}
      />
      {status && <p className="pt-food-status" style={{ color: status.tone }}>{status.text}</p>}
      <p className="pt-food-range">Your range is {low.toLocaleString()} to {high.toLocaleString()} kcal · {setByLisa ? "set by Lisa" : "starting estimate"}</p>
      <div className="pt-food-macros">
        {macros.map((m) => {
          const info = macroInfo(logs, totals, m.k)
          const t = target[m.k]
          const p = info.value == null ? null : Math.round((info.value / t) * 100)
          const left = m.k === "protein" && info.value != null && info.value < t ? `${t - info.value} g to go` : null
          return (
            <div key={m.k} className="pt-food-macro">
              <ProgressRing
                size={78} stroke={8} tone={m.tone}
                state={info.value == null ? "unknown" : "logged"}
                value={info.value} target={t}
                center={p == null ? "–" : `${p}%`}
                label={info.value == null ? `${m.name} ${info.note}` : `${m.name} ${info.value} of ${t} grams, ${p} percent`}
              />
              <b>{m.name}</b>
              <span>{info.value == null ? info.note : `${info.value} of ${t} g`}</span>
              <small>{left ?? m.goal}</small>
            </div>
          )
        })}
      </div>
    </section>
  )
}
