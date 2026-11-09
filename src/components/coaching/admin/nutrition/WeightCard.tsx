"use client"

import { useMemo } from "react"
import type { CoachingClientRecord } from "@/lib/authTokens"
import type { WeightPoint } from "@/lib/nutritionAnalytics"
import { formatWeight, fromLbs, normalizeUnit, toLbs } from "@/lib/weight"
import { plural, shortDate } from "./format"
import type { AdminCheckIn } from "./types"

function checkInPoints(checkIns: AdminCheckIn[]): WeightPoint[] {
  const points: WeightPoint[] = []
  for (const ci of checkIns) {
    const lbs = toLbs(ci.weight, ci.weightUnit)
    if (lbs != null && ci.submittedAt) points.push({ date: ci.submittedAt.slice(0, 10), lbs })
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

function Line({ points }: { points: number[] }) {
  const W = 300, H = 80, pad = 6
  const lo = Math.min(...points), hi = Math.max(...points)
  const span = hi - lo || 1
  const x = (i: number) => (points.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (points.length - 1))
  const y = (v: number) => H - pad - ((v - lo) / span) * (H - pad * 2)
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke="var(--ca-accent-mark)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {/* Zero-length round-capped strokes stay circular when the SVG stretches. */}
      <path d={points.map((v, i) => `M${x(i).toFixed(1)},${y(v).toFixed(1)}l0,0`).join(" ")} stroke="var(--ca-accent-mark)" strokeWidth={6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function WeightCard({ client, checkIns }: { client: CoachingClientRecord; checkIns: AdminCheckIn[] }) {
  const points = useMemo(() => checkInPoints(checkIns), [checkIns])
  const unit = normalizeUnit(client.weightUnit)
  const u = unit === "KG" ? "kg" : "lb"
  const first = points[0]
  const latest = points[points.length - 1]
  const change = first && latest && points.length > 1 ? fromLbs(latest.lbs, unit) - fromLbs(first.lbs, unit) : null
  const start = client.startingWeight && client.startingWeight > 0 ? client.startingWeight : null

  return (
    <section className="can-card" aria-labelledby="can-weight-h">
      <div className="can-card-head">
        <h2 id="can-weight-h" className="can-h">Weight</h2>
        <span className="can-note">{plural(points.length, "check-in reading")}</span>
      </div>
      {!latest ? (
        <p className="can-note">
          No weight in check-ins yet.{start ? ` Starting weight at setup: ${formatWeight(start, unit)} ${u}.` : ""}
        </p>
      ) : (
        <div className="can-weight">
          <div className="can-weight-nums">
            <b className="can-num">{formatWeight(latest.lbs, unit)} {u}</b>
            <span className="can-note">latest, {shortDate(latest.date)}</span>
          </div>
          {change != null && (
            <p className="can-text">
              {change === 0 ? "No change" : `${change > 0 ? "+" : "−"}${Math.abs(change).toFixed(1)} ${u}`} since {shortDate(first.date)}
            </p>
          )}
          {points.length > 1 && <Line points={points.map((p) => fromLbs(p.lbs, unit))} />}
          {start && <p className="can-note">Starting weight at setup: {formatWeight(start, unit)} {u}</p>}
        </div>
      )}
    </section>
  )
}
