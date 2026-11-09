"use client"

import { useMemo } from "react"
import { summarizePeriod } from "@/lib/nutritionAnalytics"
import { CoachRing } from "./CoachRing"
import { countKnown, proteinReached, withinCalorieRange } from "./dayInfo"
import { kcal, plural } from "./format"
import { MacroRings } from "./MacroRings"
import type { DayInfo, Macros } from "./types"
import { WeekStrip } from "./WeekStrip"

export function SummaryCard({ week, target, todayKey }: { week: DayInfo[]; target: Macros | null; todayKey: string }) {
  const summary = useMemo(() => summarizePeriod({ dailies: week.map((d) => d.totals), today: todayKey }), [week, todayKey])
  const today = week.find((d) => d.totals.date === todayKey)?.totals
  const todayTarget = today?.target?.calories ?? target?.calories ?? 0
  const days = summary.avgDays.calories
  const calRange = countKnown(week.map((d) => withinCalorieRange(d.totals)))
  const protein = countKnown(week.map((d) => proteinReached(d.totals)))

  return (
    <section className="can-card" aria-labelledby="can-summary-h">
      <div className="can-card-head">
        <h2 id="can-summary-h" className="can-h">Last 7 days</h2>
      </div>
      <WeekStrip days={week} todayKey={todayKey} />
      <hr className="can-sep" />
      <div className="can-rings">
        <CoachRing
          tone="calories" size={124}
          value={today?.logged ? today.calories : null}
          target={todayTarget}
          center={today?.logged ? kcal(today.calories) : undefined}
          sub={!today?.logged ? undefined : todayTarget > 0 ? `of ${kcal(todayTarget)}` : "kcal"}
          title="Today"
          caption={today?.logged ? "kcal logged" : "nothing logged yet"}
          label={today?.logged ? `Today: ${kcal(today.calories)} kcal${todayTarget > 0 ? ` of ${kcal(todayTarget)}` : ""}` : "Today: nothing logged yet"}
        />
        <CoachRing
          tone="calories" size={124}
          value={summary.avg ? summary.avg.calories : null}
          target={target?.calories ?? 0}
          center={summary.avg ? kcal(summary.avg.calories) : undefined}
          sub={!summary.avg ? undefined : target ? `of ${kcal(target.calories)}` : "kcal"}
          title="7-day average"
          caption={days > 0 ? plural(days, "reported day") : "no reported days"}
          label={summary.avg ? `7-day average: ${kcal(summary.avg.calories)} kcal over ${plural(days, "reported day")}` : "7-day average: no reported days"}
        />
      </div>
      {summary.avg && (
        <>
          <hr className="can-sep" />
          <h3 className="can-h3">Macros, 7-day average</h3>
          <MacroRings summary={summary} target={target} />
          {(calRange.of > 0 || protein.of > 0) && (
            <>
              <hr className="can-sep" />
              <ul className="can-facts">
                {calRange.of > 0 && <li>{calRange.yes} of {plural(calRange.of, "day")} within 10% of calorie target</li>}
                {protein.of > 0 && <li>Protein reached on {protein.yes} of {plural(protein.of, "day")}</li>}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  )
}
