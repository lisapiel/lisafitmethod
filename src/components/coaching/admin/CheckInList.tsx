"use client"

import Link from "next/link"
import { useState } from "react"
import type { CoachingCheckInRecord } from "@/lib/authTokens"
import { Empty, Icon, LoadError, SkeletonRows, initials } from "./AdminUi"
import { useAdminFetch } from "./useAdminFetch"
import { CHECK_INS_PATH } from "./paths"

type Tab = "PENDING" | "REVIEWED" | "ALL"

const NUTRITION: Record<string, string> = {
  "on-track": "Nutrition on track", "mostly-on-track": "Nutrition mostly on track", mixed: "Nutrition mixed",
  struggled: "Struggled with nutrition", "not-focusing": "Not focusing on nutrition",
}

function signals(ci: CoachingCheckInRecord) {
  const out: string[] = []
  if (typeof ci.workoutsCompleted === "number") out.push(ci.workoutsPlanned ? `${ci.workoutsCompleted}/${ci.workoutsPlanned} workouts` : `${ci.workoutsCompleted} workouts`)
  if (typeof ci.trainingRating === "number") out.push(`Training ${ci.trainingRating}/5`)
  if (typeof ci.recoveryRating === "number") out.push(`Recovery ${ci.recoveryRating}/5`)
  if (typeof ci.sleepQuality === "number") out.push(`Sleep ${ci.sleepQuality}/5`)
  if (typeof ci.energyLevel === "number") out.push(`Energy ${ci.energyLevel}/5`)
  if (ci.nutritionStatus) out.push(NUTRITION[ci.nutritionStatus] ?? ci.nutritionStatus)
  if (ci.weightStatus === "same") out.push("Weight same as last time")
  else if (ci.weightStatus === "skipped") out.push("Weight skipped")
  else if (typeof ci.weight === "number") out.push(`${ci.weight} ${(ci.weightUnit ?? "lbs").toLowerCase()}`)
  if (ci.hunger === "most-days") out.push("Hungry most days")
  return out
}

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

export default function CheckInList({ names, clientEmail, compact = false }: { names: Map<string, string>; clientEmail?: string; compact?: boolean }) {
  const { data, error, loading, reload } = useAdminFetch<{ checkIns: CoachingCheckInRecord[] }>(CHECK_INS_PATH)
  const [tab, setTab] = useState<Tab | null>(null)
  const all = (data?.checkIns ?? []).filter((ci) => !clientEmail || ci.clientEmail.toLowerCase() === clientEmail.toLowerCase())
  const pending = all.filter((ci) => (ci.status ?? "PENDING") === "PENDING").sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  const reviewed = all.filter((ci) => ci.status === "REVIEWED").sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const active: Tab = tab ?? (pending.length > 0 || !clientEmail ? "PENDING" : "ALL")
  const shown = active === "PENDING" ? pending : active === "REVIEWED" ? reviewed : [...all].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

  return (
    <>
      {error && <LoadError error={error} onRetry={reload} hasData={!!data} />}
      {data && (
        <div className="ca-filters" role="group" aria-label="Show check-ins">
          {([["PENDING", "To review", pending.length], ["REVIEWED", "Reviewed", reviewed.length], ["ALL", "All", all.length]] as const).map(([t, label, n]) => (
            <button key={t} type="button" className="ca-filter" aria-pressed={active === t} onClick={() => setTab(t)}>{label} <span style={{ opacity: 0.75 }}>{n}</span></button>
          ))}
        </div>
      )}
      <div className="ca-card">
        {!data ? (loading ? <SkeletonRows rows={compact ? 2 : 4} label="Loading check-ins" /> : null) : shown.length === 0 ? (
          active === "PENDING" ? <Empty>Nothing to review. You&apos;re up to date.</Empty> : <p className="ca-empty" style={{ color: "var(--ca-muted)" }}>No check-ins yet.</p>
        ) : (
          <ul className="ca-list">
            {shown.map((ci) => {
              const name = names.get(ci.clientEmail.toLowerCase()) ?? ci.clientEmail
              const isPending = (ci.status ?? "PENDING") === "PENDING"
              const win = ci.weeklyWin ?? ci.wins
              return (
                <li key={ci.id}>
                  <Link href={`/admin/coaching/check-ins/${ci.id}`} className={`ca-row${ci.painReported && isPending ? " ca-urgent" : ""}`} style={{ alignItems: "start" }}>
                    {clientEmail ? <span className="ca-icon"><Icon name="checkin" /></span> : <span className="ca-avatar" aria-hidden="true">{initials(name)}</span>}
                    <span className="ca-row-main">
                      <span style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                        <span className="ca-row-title ca-trunc" style={{ flex: "1 1 auto" }}>{clientEmail ? `Week of ${when(ci.submittedAt)}` : name}</span>
                        {!clientEmail && <span className="ca-row-meta" style={{ flex: "none" }}>{when(ci.submittedAt)}</span>}
                      </span>
                      <span className="ca-meta-line">{signals(ci).map((s) => <span key={s}>{s}</span>)}</span>
                      {win && !compact && <span className="ca-row-meta ca-clamp2">Win: {win}</span>}
                      <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                        {ci.painReported && <span className="ca-chip" data-tone="danger">Pain reported</span>}
                        {ci.formReviewRequested && <span className="ca-chip" data-tone="warn">Form review requested</span>}
                        <span className="ca-chip" data-tone={isPending ? "warn" : "ok"}>{isPending ? "To review" : "Reviewed"}</span>
                      </span>
                    </span>
                    <span className="ca-row-aside" style={{ alignSelf: "center", color: "var(--ca-muted)" }}><Icon name="chevron" /></span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
