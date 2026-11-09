"use client"

import type { DailyTotals, PeriodSummary } from "@/lib/nutritionAnalytics"
import ProgressRing from "./ProgressRing"

type Target = { calories: number; protein: number }

function dayName(key: string, isToday: boolean) {
  if (isToday) return "Today"
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" })
}

export default function FoodWeek({ days, summary, target, todayKey, selected, onSelect }: { days: DailyTotals[]; summary: PeriodSummary; target: Target; todayKey: string; selected?: string; onSelect?: (date: string) => void }) {
  const n = summary.loggedDays
  const missing = days.filter((d) => !d.logged && d.date !== todayKey).length
  const pDays = summary.avgDays.protein
  return (
    <section className="pt-food-week" aria-label="Last 7 days">
      <h2>Last 7 days</h2>
      <ol className="pt-food-days">
        {days.map((d) => {
          const today = d.date === todayKey
          const label = d.logged ? `${dayName(d.date, today)}: ${d.calories} calories` : `${dayName(d.date, today)}: nothing logged`
          return (
            <li key={d.date}>
              <button type="button" className="pt-day-pick" aria-pressed={selected === d.date} aria-label={`${label}. Show this day`} onClick={() => onSelect?.(d.date)}>
                <ProgressRing size={36} stroke={4} tone="calories" state={d.logged ? "logged" : "unknown"} value={d.logged ? d.calories : null} target={d.target?.calories ?? target.calories} label={label} />
                <span style={today ? { color: "#1a1a1a", fontWeight: 700 } : undefined}>{dayName(d.date, today)}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {n === 0 ? (
        <p className="pt-food-foot">Nothing logged in the last 7 days yet.</p>
      ) : (
        <>
          <div className="pt-food-avgs">
            <div><b>{summary.avg!.calories.toLocaleString()} kcal</b><span>average · {Math.round((summary.avg!.calories / target.calories) * 100)}% of target</span></div>
            <div>{pDays > 0
              ? <><b>{summary.avg!.protein} g</b><span>protein · {Math.round((summary.avg!.protein / target.protein) * 100)}% of goal</span></>
              : <><b>Protein</b><span>not logged</span></>}</div>
          </div>
          <p className="pt-food-foot">
            Based on {n} reported {n === 1 ? "day" : "days"}{pDays > 0 && pDays < n ? `, protein on ${pDays} of them` : ""}.
            {missing > 0 ? ` ${missing} ${missing === 1 ? "day has" : "days have"} nothing logged, so ${missing === 1 ? "it isn't" : "they aren't"} counted.` : ""}
          </p>
        </>
      )}
    </section>
  )
}
