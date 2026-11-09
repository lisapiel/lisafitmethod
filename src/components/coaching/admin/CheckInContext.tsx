"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { buildDailyTotals, summarizePeriod } from "@/lib/nutritionAnalytics"
import { resolveMacrosFor } from "@/lib/nutrition"
import { addDaysToKey, localDateKey } from "@/lib/localDate"
import type { CoachingClientRecord, NutritionLogRecord } from "@/lib/authTokens"
import ProgressRing from "@/components/portal/ProgressRing"

type Props = {
  token: string
  clientEmail: string
  submittedAt: string
  weight: number | null
  weightUnit: string | null
  workoutsCompleted: number | null
  workoutsPlanned: number | null
  trainingRating: number | null
  recovery: Array<{ label: string; value: number | null; higherIsWorse?: boolean }>
}

type CheckInLite = { clientEmail: string; submittedAt: string; weight?: number | null }

export default function CheckInContext(p: Props) {
  const [logs, setLogs] = useState<NutritionLogRecord[] | null>(null)
  const [client, setClient] = useState<CoachingClientRecord | null>(null)
  const [prevWeight, setPrevWeight] = useState<{ weight: number; at: string } | null>(null)
  const end = localDateKey(new Date(p.submittedAt))
  const start = addDaysToKey(end, -6)
  const enc = encodeURIComponent(p.clientEmail)

  useEffect(() => {
    if (!p.token) return
    const h = { Authorization: `Bearer ${p.token}` }
    fetch(`/api/admin/coaching/clients/${enc}/nutrition-logs?from=${start}&to=${end}`, { headers: h }).then((r) => r.json()).then((d) => setLogs(d.logs ?? [])).catch(() => setLogs([]))
    fetch(`/api/admin/coaching/clients/${enc}`, { headers: h }).then((r) => r.json()).then((d) => setClient(d.client ?? null)).catch(() => {})
    fetch(`/api/admin/coaching/check-ins`, { headers: h }).then((r) => r.json()).then((d: { checkIns?: CheckInLite[] }) => {
      const prev = (d.checkIns ?? []).filter((c) => c.clientEmail?.toLowerCase() === p.clientEmail.toLowerCase() && c.submittedAt < p.submittedAt && c.weight != null)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
      if (prev) setPrevWeight({ weight: Number(prev.weight), at: prev.submittedAt })
    }).catch(() => {})
  }, [p.token, enc, start, end, p.clientEmail, p.submittedAt])

  const target = client ? resolveMacrosFor(client) : null
  const dailies = logs ? buildDailyTotals({ logs, from: start, to: end, currentTarget: target ?? undefined }) : []
  const summary = logs ? summarizePeriod({ dailies, today: addDaysToKey(end, 1) }) : null
  const est = (logs ?? []).filter((l) => l.source === "message-estimate").length
  const n = summary?.loggedDays ?? 0
  const unit = (p.weightUnit ?? "LBS").toUpperCase() === "KG" ? "kg" : "lb"
  const change = p.weight != null && prevWeight ? +(p.weight - prevWeight.weight).toFixed(1) : null
  const weeks = prevWeight ? Math.max(1, Math.round((Date.parse(p.submittedAt) - Date.parse(prevWeight.at)) / (7 * 864e5))) : null

  return (
    <section className="ca-ctx" aria-label="Context for this check-in">
      <div className="ca-ctx-head">
        <h2>Their week at a glance</h2>
        <Link href={`/admin/coaching/clients/${enc}/nutrition`}>Open Nutrition</Link>
      </div>
      <div className="ca-ctx-rings">
        <div>
          <ProgressRing trackColor="var(--ca-line)" textColor="var(--ca-text)" mutedColor="var(--ca-muted)" size={92} stroke={9} tone="calories" state={n > 0 && target ? "logged" : "unknown"} value={n > 0 ? summary!.avg!.calories : null} target={target?.calories ?? 1}
            center={n > 0 && target ? `${Math.round((summary!.avg!.calories / target.calories) * 100)}%` : "–"} label={n > 0 && target ? `Calories average ${summary!.avg!.calories} of ${target.calories}` : "No food logged that week"} />
          <b>Calories</b>
          <span>{n > 0 && target ? `${summary!.avg!.calories.toLocaleString()} of ${target.calories.toLocaleString()} · ${n} ${n === 1 ? "day" : "days"}` : "nothing logged"}</span>
        </div>
        <div>
          <ProgressRing trackColor="var(--ca-line)" textColor="var(--ca-text)" mutedColor="var(--ca-muted)" size={92} stroke={9} tone="protein" state={summary && summary.avgDays.protein > 0 && target ? "logged" : "unknown"} value={summary && summary.avgDays.protein > 0 ? summary.avg!.protein : null} target={target?.protein ?? 1}
            center={summary && summary.avgDays.protein > 0 && target ? `${Math.round((summary.avg!.protein / target.protein) * 100)}%` : "–"} label="Protein average" />
          <b>Protein</b>
          <span>{summary && summary.avgDays.protein > 0 && target ? `${summary.avg!.protein} of ${target.protein} g · ${summary.avgDays.protein} ${summary.avgDays.protein === 1 ? "day" : "days"}` : "not logged"}</span>
        </div>
        <div>
          <ProgressRing trackColor="var(--ca-line)" textColor="var(--ca-text)" mutedColor="var(--ca-muted)" size={92} stroke={9} tone="training" state={p.workoutsPlanned ? "logged" : "unknown"} value={p.workoutsCompleted ?? 0} target={p.workoutsPlanned ?? 1}
            center={p.workoutsPlanned ? `${p.workoutsCompleted ?? 0}/${p.workoutsPlanned}` : `${p.workoutsCompleted ?? 0}`} label={`Workouts ${p.workoutsCompleted ?? 0} of ${p.workoutsPlanned ?? "unknown"}`} />
          <b>Workouts</b>
          <span>{p.trainingRating != null ? `felt ${p.trainingRating} of 5` : "completed"}</span>
        </div>
      </div>
      <p className="ca-ctx-note">
        {logs === null ? "Loading food logs…" : n === 0 ? "No food logged in the 7 days before this check-in." : `Food on ${n} of 7 days before this check-in${est > 0 ? `, including ${est} recovered ${est === 1 ? "estimate" : "estimates"}` : ""}.`}
      </p>
      <div className="ca-ctx-grid">
        <div className="ca-ctx-cell">
          <span>Weight</span>
          <b>{p.weight != null ? `${p.weight} ${unit}` : "Not given"}</b>
          <span>{change != null ? `${change > 0 ? "+" : ""}${change} ${unit} since the check-in ${weeks} ${weeks === 1 ? "week" : "weeks"} before` : p.weight != null ? "First weight check-in" : ""}</span>
        </div>
        <div className="ca-ctx-cell">
          <span>Recovery (1 to 5)</span>
          {p.recovery.filter((r) => r.value != null).map((r) => (
            <div key={r.label} className="ca-ctx-bar"><span>{r.label}</span><i><em style={{ width: `${(r.value! / 5) * 100}%` }} data-warn={r.higherIsWorse && r.value! >= 4 ? "" : undefined} /></i><span>{r.value}</span></div>
          ))}
          {p.recovery.every((r) => r.value == null) && <b>Not given</b>}
        </div>
      </div>
    </section>
  )
}
