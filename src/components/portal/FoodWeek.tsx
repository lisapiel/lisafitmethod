"use client"

import type { DailyTotals } from "@/lib/nutritionAnalytics"
import ProgressRing from "./ProgressRing"

function dayName(key: string, isToday: boolean) {
  if (isToday) return "Today"
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" })
}

// Compact history: one ring per day, tap a day to list its food. The weekly
// averages live in the summary card's "Last 7 days" view.
export default function FoodWeek({ days, targetCalories, todayKey, selected, onSelect }: { days: DailyTotals[]; targetCalories: number; todayKey: string; selected?: string; onSelect?: (date: string) => void }) {
  const logged = days.filter((d) => d.logged).length
  return (
    <section className="pt-food-week" aria-label="Days logged">
      <div className="pt-food-week-head">
        <h2>Days logged</h2>
        <span>{logged} of {days.length}</span>
      </div>
      <ol className="pt-food-days">
        {days.map((d) => {
          const today = d.date === todayKey
          const label = d.logged ? `${dayName(d.date, today)}: ${d.calories} calories` : `${dayName(d.date, today)}: nothing logged`
          return (
            <li key={d.date}>
              <button type="button" className="pt-day-pick" aria-pressed={selected === d.date} aria-label={`${label}. Show this day`} onClick={() => onSelect?.(d.date)}>
                <ProgressRing size={36} stroke={4} tone="calories" state={d.logged ? "logged" : "unknown"} value={d.logged ? d.calories : null} target={d.target?.calories ?? targetCalories} label={label} />
                <span style={today ? { color: "#1a1a1a", fontWeight: 700 } : undefined}>{dayName(d.date, today)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
