"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { localDateKey } from "@/lib/localDate"
import type { NutritionLogRecord } from "@/lib/authTokens"
import ProgressRing from "./ProgressRing"
import { ChevronRight } from "./PortalIcons"

type Props = {
  week: { label: string; finished: number; total: number; sportDays: number[] } | null
  checkIn: { due: boolean; daysAgo: number | null }
  target: { calories: number; protein: number } | null
  setupNeeded: boolean
  // Today's food logs when the page already loaded them; null while loading.
  todayLogs?: NutritionLogRecord[] | null
}

export default function HomeGlance({ week, checkIn, target, setupNeeded, todayLogs }: Props) {
  const [fetched, setToday] = useState<NutritionLogRecord[] | null>(null)
  const provided = todayLogs !== undefined
  const today = provided ? todayLogs : fetched
  useEffect(() => {
    if (provided) return
    const key = localDateKey()
    fetch(`/api/coaching/nutrition-logs?from=${key}&to=${key}`)
      .then((r) => (r.ok ? r.json() : { logs: [] }))
      .then((d: { logs?: NutritionLogRecord[] }) => setToday((d.logs ?? []).filter((l) => l.date === key)))
      .catch(() => setToday([]))
  }, [provided])

  const kcal = today?.reduce((a, l) => a + (l.calories || 0), 0) ?? 0
  const proteinKnown = !!today && today.length > 0 && today.every((l) => typeof l.protein === "number")
  const protein = proteinKnown ? today!.reduce((a, l) => a + (l.protein ?? 0), 0) : null

  return (
    <div className="pt-glance2">
      {week && (
        <Link className="pt-week-strip" href="/my-coaching/workouts">
          <span><b>{week.label}</b><span>{week.finished} of {week.total} workouts done</span></span>
          <span className="pt-week-marks" aria-hidden="true">
            {Array.from({ length: week.total }, (_, i) => (
              <i key={i} data-done={i < week.finished ? "" : undefined} data-sport={week.sportDays.includes(i) ? "" : undefined} />
            ))}
          </span>
        </Link>
      )}

      {(checkIn.due || setupNeeded) && (
        <section className="pt-todo" aria-label="To do">
          <h2>To do</h2>
          {checkIn.due && (
            <Link className="pt-todo-row" href="/my-coaching/check-in">
              <span className="pt-todo-text"><b>Weekly check-in</b><span>Due now · about 4 minutes</span></span>
              <span className="pt-todo-go">Start</span>
            </Link>
          )}
          {setupNeeded && (
            <Link className="pt-todo-row" href="/my-coaching/setup">
              <span className="pt-todo-text"><b>Set up your food targets</b><span>A few details so your numbers fit you</span></span>
              <span className="pt-todo-go">Set up</span>
            </Link>
          )}
        </section>
      )}

      {target && !setupNeeded && (
        <Link className="pt-food-glance" href="/my-coaching/nutrition">
          <ProgressRing
            size={92} stroke={10} tone="calories"
            state={today && today.length > 0 ? "logged" : "unknown"}
            value={today && today.length > 0 ? kcal : null} target={target.calories}
            center={today && today.length > 0 ? kcal.toLocaleString() : "–"}
            sub={`of ${target.calories.toLocaleString()}`}
            label={today && today.length > 0 ? `${kcal} of ${target.calories} calories today` : "Nothing logged today"}
          />
          <span className="pt-food-glance-text">
            <b>Today&apos;s food</b>
            {today === null ? <span>Loading…</span>
              : today.length === 0 ? <span>Nothing logged yet. Tap to add food.</span>
              : <span>{kcal.toLocaleString()} of {target.calories.toLocaleString()} kcal{protein != null ? ` · ${protein} of ${target.protein} g protein` : ""}</span>}
          </span>
          <span className="pt-chev"><ChevronRight /></span>
        </Link>
      )}

    </div>
  )
}
