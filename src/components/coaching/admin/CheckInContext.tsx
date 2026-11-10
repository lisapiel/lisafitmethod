"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { buildDailyTotals, summarizePeriod } from "@/lib/nutritionAnalytics"
import { resolveMacrosFor } from "@/lib/nutrition"
import { addDaysToKey, localDateKey } from "@/lib/localDate"
import type { CoachingClientRecord, NutritionLogRecord } from "@/lib/authTokens"
import ProgressRing from "@/components/portal/ProgressRing"
import { buildWeightHistory, formatReading, formatWeighInDay, weighInDayKey, type WeightReading } from "@/lib/weightHistory"
import { fromLbs } from "@/lib/weight"

type Props = {
  token: string
  clientEmail: string
  submittedAt: string
  // The check-in's weight answer as one line (new weight, same as last time,
  // skipped, or an older check-in's value). Null when none was given.
  weightLine: string | null
  weightStatus: string | null
  workoutsCompleted: number | null
  workoutsPlanned: number | null
  trainingRating: number | null
  recovery: Array<{ label: string; value: number | null; higherIsWorse?: boolean }>
}

type CheckInLite = { clientEmail: string; submittedAt: string; weight?: number | null; weightUnit?: string | null; weightStatus?: string | null }
type SnapshotLite = { snapshotDate?: string; weight?: number | null; weightUnit?: string | null }

// The weigh-ins up to this check-in's day, from check-ins and Progress logs
// together, with a same-day duplicate counted once.
function weighInsUpTo(checkIns: CheckInLite[], logged: SnapshotLite[], submittedAt: string, timeZone?: string): WeightReading[] {
  const day = localDateKey(new Date(submittedAt), timeZone)
  return buildWeightHistory({ checkIns: checkIns.filter((c) => c.submittedAt <= submittedAt), logged, timeZone })
    .filter((r) => (weighInDayKey(r.at, timeZone) ?? "") <= day)
}

function weightChangeLine(history: WeightReading[], status: string | null): string {
  const current = history[history.length - 1]
  if (!current) return status === "skipped" ? "No weigh-ins yet" : ""
  if (status === "skipped") return `Last weigh-in ${formatReading(current)} on ${formatWeighInDay(current.at)}`
  const prev = history[history.length - 2]
  if (!prev) return "First weigh-in"
  const change = +fromLbs(current.lbs - prev.lbs, current.unit).toFixed(1)
  const unit = current.unit === "KG" ? "kg" : "lb"
  return `${change > 0 ? "+" : ""}${change} ${unit} from ${formatWeighInDay(prev.at)} to ${formatWeighInDay(current.at)}`
}

export default function CheckInContext(p: Props) {
  const [logs, setLogs] = useState<NutritionLogRecord[] | null>(null)
  const [client, setClient] = useState<CoachingClientRecord | null>(null)
  const [weighIns, setWeighIns] = useState<{ checkIns: CheckInLite[]; logged: SnapshotLite[] } | null>(null)
  const end = localDateKey(new Date(p.submittedAt))
  const start = addDaysToKey(end, -6)
  const enc = encodeURIComponent(p.clientEmail)

  useEffect(() => {
    if (!p.token) return
    const h = { Authorization: `Bearer ${p.token}` }
    fetch(`/api/admin/coaching/clients/${enc}/nutrition-logs?from=${start}&to=${end}`, { headers: h }).then((r) => r.json()).then((d) => setLogs(d.logs ?? [])).catch(() => setLogs([]))
    fetch(`/api/admin/coaching/clients/${enc}`, { headers: h }).then((r) => r.json()).then((d) => setClient(d.client ?? null)).catch(() => {})
    Promise.all([
      fetch(`/api/admin/coaching/check-ins`, { headers: h }).then((r) => r.json()) as Promise<{ checkIns?: CheckInLite[] }>,
      fetch(`/api/admin/coaching/progress/${enc}`, { headers: h }).then((r) => r.json()) as Promise<{ snapshots?: SnapshotLite[] }>,
    ]).then(([ci, pr]) => setWeighIns({
      checkIns: (ci.checkIns ?? []).filter((c) => c.clientEmail?.toLowerCase() === p.clientEmail.toLowerCase()),
      logged: pr.snapshots ?? [],
    })).catch(() => setWeighIns({ checkIns: [], logged: [] }))
  }, [p.token, enc, start, end, p.clientEmail])

  const target = client ? resolveMacrosFor(client) : null
  const dailies = logs ? buildDailyTotals({ logs, from: start, to: end, currentTarget: target ?? undefined }) : []
  const summary = logs ? summarizePeriod({ dailies, today: addDaysToKey(end, 1) }) : null
  const est = (logs ?? []).filter((l) => l.source === "message-estimate").length
  const n = summary?.loggedDays ?? 0
  // Logged days carry the client's own time zone; use it to decide which
  // readings fall on the same day for them.
  const clientTimeZone = (logs ?? []).find((l) => l.timeZone)?.timeZone
  const history = weighIns ? weighInsUpTo(weighIns.checkIns, weighIns.logged, p.submittedAt, clientTimeZone) : null

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
          <b>{p.weightLine ?? "Not given"}</b>
          <span>{history === null ? "Loading weigh-ins…" : p.weightLine ? weightChangeLine(history, p.weightStatus) : ""}</span>
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
