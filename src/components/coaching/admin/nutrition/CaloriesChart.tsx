"use client"

import { useState } from "react"
import { chartFacts, MIN_DAYS_FOR_FACTS } from "./chartFacts"
import { kcal, keyToDate, plural, shortDate, weekday } from "./format"
import type { DayInfo } from "./types"

type Range = 7 | 30

function axisLabel(date: string, i: number, n: number, todayKey: string): string {
  if (n <= 7) return date === todayKey ? "Today" : weekday(date)
  if (i === n - 1 || (n - 1 - i) % 7 === 0) return String(keyToDate(date).getDate())
  return ""
}

function describe(d: DayInfo): string {
  if (!d.totals.logged) return `${shortDate(d.totals.date)}: nothing logged`
  const parts = [`${shortDate(d.totals.date)}: ${kcal(d.totals.calories)} kcal`]
  if (d.snackCalories > 0) parts.push(`${kcal(d.snackCalories)} from snacks`)
  if (d.hasRecovered) parts.push("includes an estimate from Messages")
  return parts.join(", ")
}

export function CaloriesChart({ days, targetCalories, todayKey }: { days: DayInfo[]; targetCalories: number | null; todayKey: string }) {
  const [range, setRange] = useState<Range>(7)
  const shown = days.slice(-range)
  const max = Math.max(targetCalories ?? 0, ...shown.map((d) => d.totals.calories), 1) * 1.1
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`
  const emptyHeight = targetCalories ? pct(targetCalories) : "40%"
  const facts = chartFacts(shown)
  const loggedCount = shown.filter((d) => d.totals.logged).length
  const anySnack = shown.some((d) => d.snackCalories > 0)
  const anyRecovered = shown.some((d) => d.hasRecovered)

  return (
    <section className="can-card" aria-labelledby="can-chart-h">
      <div className="can-card-head">
        <h2 id="can-chart-h" className="can-h">Calories by day</h2>
        <div className="can-seg" role="group" aria-label="Days shown">
          {([7, 30] as Range[]).map((r) => (
            <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>{r} days</button>
          ))}
        </div>
      </div>

      <div className="can-chart" {...(range > 7 ? { "data-dense": "" } : {})}>
        <ol className="can-bars" aria-label={`Calories for the last ${range} days`}>
          {shown.map((d) => {
            const c = d.totals.calories
            return (
              <li key={d.totals.date}>
                {d.totals.logged ? (
                  <span className="can-bar" style={{ height: pct(c) }} {...(d.hasRecovered ? { "data-est": "" } : {})} aria-hidden="true">
                    {d.snackCalories > 0 && <span className="can-bar-snack" style={{ height: `${(d.snackCalories / c) * 100}%` }} />}
                  </span>
                ) : (
                  <span className="can-bar-empty" style={{ height: emptyHeight }} aria-hidden="true" />
                )}
                <span className="ca-sr">{describe(d)}</span>
              </li>
            )
          })}
        </ol>
        {targetCalories != null && (
          <div className="can-target" style={{ bottom: pct(targetCalories) }} aria-hidden="true">
            <span>Target {kcal(targetCalories)}</span>
          </div>
        )}
      </div>
      <div className="can-axis" aria-hidden="true">
        {shown.map((d, i) => (
          <span key={d.totals.date} {...(d.totals.date === todayKey ? { "data-today": "" } : {})}>
            {axisLabel(d.totals.date, i, shown.length, todayKey)}
          </span>
        ))}
      </div>

      <ul className="can-legend" aria-label="Key">
        <li><span className="can-key-bar" style={{ background: "var(--can-bar)" }} aria-hidden="true" />Calories</li>
        {anySnack && <li><span className="can-key-bar" style={{ background: "var(--can-bar-snack)" }} aria-hidden="true" />Snacks</li>}
        {anyRecovered && <li><span className="can-sq" data-state="recovered" aria-hidden="true" />Estimate from Messages</li>}
        <li><span className="can-sq" data-state="empty" aria-hidden="true" />Nothing logged</li>
        {targetCalories != null && <li><span aria-hidden="true" style={{ width: 16, borderTop: "1.5px dashed var(--ca-text-2)", display: "inline-block" }} />Current target</li>}
      </ul>

      <hr className="can-sep" />
      {facts.length > 0 ? (
        <ul className="can-facts">{facts.map((f) => <li key={f}>{f}</li>)}</ul>
      ) : (
        <p className="can-note">
          {loggedCount === 0
            ? `Nothing logged in the last ${range} days.`
            : `${plural(loggedCount, "day")} with food logged. A few simple counts show here once there are at least ${MIN_DAYS_FOR_FACTS}.`}
        </p>
      )}
    </section>
  )
}
