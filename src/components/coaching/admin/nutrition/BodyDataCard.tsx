"use client"

import Link from "next/link"
import { useMemo } from "react"
import type { CoachingClientRecord } from "@/lib/authTokens"
import { activityLabel, formatHeight, GOAL_META } from "@/lib/nutrition"
import { shortDate } from "./format"
import { StartingWeightPanel } from "./StartingWeightPanel"
import type { AdminCheckIn, AdminSnapshot } from "./types"

type Reading = { date: string; label: string; value: number; unit: string }

function parseSnapshot(json: string | undefined, date: string): Reading[] {
  if (!json || !date) return []
  try {
    const parsed = JSON.parse(json) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((m: unknown) => {
      if (!m || typeof m !== "object") return []
      const r = m as Record<string, unknown>
      const value = Number(r.value)
      if (typeof r.label !== "string" || !r.label || !Number.isFinite(value)) return []
      return [{ date, label: r.label, value, unit: typeof r.unit === "string" ? r.unit : "in" }]
    })
  } catch {
    return []
  }
}

function latestReadings(snapshots: AdminSnapshot[], checkIns: AdminCheckIn[]): Reading[] {
  const rows: Reading[] = []
  for (const s of snapshots) {
    const d = s.snapshotDate?.slice(0, 10) ?? ""
    if (!d) continue
    const fields: Array<[string, number | undefined]> = [
      ["Waist", s.waist], ["Hips", s.hips], ["Chest", s.chest], ["Arm", s.arm], ["Thigh", s.thigh], ["Glutes", s.glutes],
    ]
    for (const [label, v] of fields) if (v != null && Number.isFinite(v)) rows.push({ date: d, label, value: v, unit: "in" })
  }
  for (const ci of checkIns) rows.push(...parseSnapshot(ci.measurementSnapshot, ci.submittedAt?.slice(0, 10) ?? ""))
  rows.sort((a, b) => b.date.localeCompare(a.date))
  const byLabel = new Map<string, Reading>()
  for (const r of rows) if (!byLabel.has(r.label)) byLabel.set(r.label, r)
  return Array.from(byLabel.values())
}

export function BodyDataCard({ client, email, snapshots, checkIns, onChanged }: { client: CoachingClientRecord; email: string; snapshots: AdminSnapshot[]; checkIns: AdminCheckIn[]; onChanged: () => Promise<void> | void }) {
  const latest = useMemo(() => latestReadings(snapshots, checkIns), [snapshots, checkIns])
  const hasBody = client.heightInches != null && client.age != null && client.sex != null && client.activityLevel != null
  const facts: Array<[string, string]> = [
    ["Sex", client.sex ?? "Not given"],
    ["Age", client.age != null ? String(client.age) : "Not given"],
    ["Height", client.heightInches != null ? formatHeight(client.heightInches) : "Not given"],
    ["Starting weight", client.startingWeight ? `${client.startingWeight} lb` : "Not given"],
    ["Activity", activityLabel(client.activityLevel) ?? "Not given"],
    ["Goal", client.nutritionGoal ? GOAL_META[client.nutritionGoal].label : "Not given"],
  ]

  return (
    <section className="can-card" aria-labelledby="can-body-h">
      <div className="can-card-head">
        <h2 id="can-body-h" className="can-h">Setup and body data</h2>
        <span className="can-note">The client edits this in setup. You correct the starting weight.</span>
      </div>
      {!hasBody && <p className="can-note" style={{ marginBottom: 12 }}>Setup isn&apos;t complete yet, so there&apos;s no starting estimate.</p>}
      <div className="can-chips">
        {facts.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
      </div>
      <StartingWeightPanel email={email} client={client} onChanged={onChanged} />
      {latest.length > 0 && (
        <>
          <hr className="can-sep" />
          <h3 className="can-h3">Latest measurements</h3>
          <div className="can-chips">
            {latest.map((m) => <div key={m.label}><span>{m.label}, {shortDate(m.date)}</span><b>{m.value} {m.unit}</b></div>)}
          </div>
        </>
      )}
      <p className="can-note" style={{ marginTop: 12 }}>
        Full history is on the <Link href={`/admin/coaching/clients/${encodeURIComponent(email)}/progress`} className="ca-link">Progress tab</Link>.
      </p>
    </section>
  )
}
