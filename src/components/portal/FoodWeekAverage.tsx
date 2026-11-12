"use client"

import { calorieRange, type AverageVsTarget, type PeriodAverages } from "@/lib/nutritionAnalytics"
import FoodRings, { type FoodMacroKey } from "./FoodRings"

// On the narrowest phones the label wraps as "logged / 1 of 2 days", never splitting the count.
const keepTogether = (t: string) => t.replace(/ /g, "\u00a0")

const pctOf = (a: AverageVsTarget) => (a.target > 0 ? Math.round((a.avg / a.target) * 100) : null)

export default function FoodWeekAverage({ averages, loggedDays, windowDays, setByLisa }: { averages: PeriodAverages; loggedDays: number; windowDays: number; setByLisa: boolean }) {
  const cal = averages.calories
  if (!cal || loggedDays === 0) {
    return (
      <div className="pt-food-empty">
        <p className="pt-food-empty-title">Nothing logged in the last {windowDays} days</p>
        <p>Once you log a day, your daily averages will show up here.</p>
      </div>
    )
  }
  const { low, high } = calorieRange(cal.target)
  const pct = pctOf(cal)
  const status = cal.avg > high ? { text: `Averaging ${(cal.avg - cal.target).toLocaleString()} above your target`, tone: "#7a4f14" }
    : cal.avg >= low ? { text: "Averaging within your range", tone: "#3f6b45" }
    : { text: `Averaging ${(cal.target - cal.avg).toLocaleString()} below your target`, tone: "#57514b" }
  const macros: Array<{ k: FoodMacroKey; name: string; goal: string }> = [
    { k: "protein", name: "Protein", goal: "goal" },
    { k: "carbs", name: "Carbs", goal: "guide" },
    { k: "fat", name: "Fat", goal: "guide" },
  ]
  const days = `Based on ${loggedDays} of ${windowDays} days logged. Unlogged days aren't counted.`
  return (
    <FoodRings
      calories={{
        value: cal.avg,
        target: cal.target,
        center: cal.avg.toLocaleString(),
        sub: `of ${cal.target.toLocaleString()} kcal · ${pct}%`,
        label: `Daily average ${cal.avg} of ${cal.target} calories, ${pct} percent, over ${loggedDays} logged ${loggedDays === 1 ? "day" : "days"}`,
      }}
      status={status}
      range={`Your range is ${low.toLocaleString()} to ${high.toLocaleString()} kcal · ${averages.targetChanged ? "averaged across this week's targets" : setByLisa ? "set by Lisa" : "starting estimate"}`}
      macros={macros.map((m) => {
        const a = averages[m.k]
        if (!a) return { k: m.k, name: m.name, value: null, target: 0, center: "–", detail: "not logged", foot: m.goal, label: `${m.name} not logged this week` }
        const p = pctOf(a)
        return {
          k: m.k, name: m.name, value: a.avg, target: a.target,
          center: p == null ? "–" : `${p}%`,
          detail: `${a.avg} of ${a.target} g`,
          foot: a.days < loggedDays ? `logged ${keepTogether(`${a.days} of ${loggedDays} days`)}` : m.goal,
          label: `${m.name} daily average ${a.avg} of ${a.target} grams, ${p} percent, over ${a.days} ${a.days === 1 ? "day" : "days"}`,
        }
      })}
      foot={averages.targetChanged ? `${days} Your targets changed this week, so each day is compared with the target it had then.` : days}
    />
  )
}
