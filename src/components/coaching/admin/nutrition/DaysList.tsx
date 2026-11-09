"use client"

import { useMemo, useState } from "react"
import type { NutritionLogRecord } from "@/lib/authTokens"
import { buildDailyTotals, type MacroTarget } from "@/lib/nutritionAnalytics"
import { addDaysToKey } from "@/lib/localDate"
import { buildDayInfo } from "./dayInfo"
import { DayRow } from "./DayRow"

const STEP = 14

export function DaysList({ logs, currentTarget, todayKey }: { logs: NutritionLogRecord[]; currentTarget?: MacroTarget; todayKey: string }) {
  const [span, setSpan] = useState(STEP)
  const earliest = useMemo(() => logs.reduce<string | null>((a, l) => (a == null || l.date < a ? l.date : a), null), [logs])
  const from = addDaysToKey(todayKey, -(span - 1))
  const days = useMemo(() => {
    const dailies = buildDailyTotals({ logs, from, to: todayKey, currentTarget })
    return buildDayInfo(dailies, logs).reverse()
  }, [logs, from, todayKey, currentTarget])
  const hasOlder = earliest != null && earliest < from

  return (
    <section className="can-card" aria-labelledby="can-days-h">
      <div className="can-card-head">
        <h2 id="can-days-h" className="can-h">Days</h2>
        <span className="can-note">Newest first</span>
      </div>
      {earliest == null ? (
        <p className="can-note">No food logged yet.</p>
      ) : (
        <>
          <ul className="can-days">
            {days.map((d) => (
              <li key={d.totals.date}>
                <DayRow day={d} todayKey={todayKey} yesterdayKey={addDaysToKey(todayKey, -1)} />
              </li>
            ))}
          </ul>
          {hasOlder && (
            <div className="can-actions" style={{ marginTop: 8 }}>
              <button type="button" className="ca-btn" onClick={() => setSpan((s) => s + STEP)}>Show 14 earlier days</button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
