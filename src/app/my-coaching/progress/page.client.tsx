"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

type WeightPoint = { date: string; weight: number; unit: string }
type Snapshot = {
  id: string
  snapshotDate: string
  weight: number | null
  weightUnit: string | null
  waist: number | null
  hips: number | null
  chest: number | null
  arm: number | null
  thigh: number | null
  notes: string | null
}

function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length < 2) {
    return (
      <div style={{ background: "#faf8f5", borderRadius: 8, padding: "2rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted }}>
          {data.length === 0 ? "Weight data will appear here once you've submitted check-ins." : "Submit one more check-in to see your trend."}
        </p>
      </div>
    )
  }

  const W = 580, H = 130, padX = 40, padY = 18
  const plotW = W - padX * 2, plotH = H - padY * 2
  const weights = data.map((d) => d.weight)
  const minW = Math.min(...weights), maxW = Math.max(...weights)
  const range = maxW - minW || 1
  const toX = (i: number) => padX + (i / (data.length - 1)) * plotW
  const toY = (w: number) => padY + ((maxW - w) / range) * plotH
  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.weight)}`).join(" ")
  const areaD = `${pathD} L ${toX(data.length - 1)} ${padY + plotH} L ${padX} ${padY + plotH} Z`
  const latest = data[data.length - 1]
  const first = data[0]
  const diff = +(latest.weight - first.weight).toFixed(1)

  return (
    <div>
      <div style={{ display: "flex", gap: 28, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Current</p>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: 0 }}>{latest.weight} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: muted }}>{latest.unit}</span></p>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Change</p>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: diff < 0 ? "#5c9e6a" : diff > 0 ? "#d97460" : muted, margin: 0 }}>
            {diff > 0 ? "+" : ""}{diff} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: muted }}>{latest.unit}</span>
          </p>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Check-ins</p>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: 0 }}>{data.length}</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
        <defs>
          <linearGradient id="wg-client" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#wg-client)" />
        <path d={pathD} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.weight)} r={i === data.length - 1 ? 4 : 3} fill={i === data.length - 1 ? accent : `${accent}88`} />
        ))}
        <text x={padX} y={H - 4} fontFamily="var(--font-dm-sans), sans-serif" fontSize="9" fill={muted}>
          {new Date(data[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </text>
        <text x={W - padX} y={H - 4} fontFamily="var(--font-dm-sans), sans-serif" fontSize="9" fill={muted} textAnchor="end">
          {new Date(data[data.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </text>
        <text x={padX - 4} y={toY(maxW) + 4} fontFamily="var(--font-dm-sans), sans-serif" fontSize="9" fill={muted} textAnchor="end">{maxW}</text>
        <text x={padX - 4} y={toY(minW) + 4} fontFamily="var(--font-dm-sans), sans-serif" fontSize="9" fill={muted} textAnchor="end">{minW}</text>
      </svg>
    </div>
  )
}

function MeasRow({ label, value, unit = "in" }: { label: string; value: number | null; unit?: string }) {
  if (!value) return null
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${border}` }}>
      <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted }}>{label}</span>
      <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: black, fontWeight: 600 }}>{value} {unit}</span>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

type WorkoutLog = { completedAt: string; weekNumber: number; dayLabel: string; setData?: string }
type WorkoutStats = {
  total: number
  thisWeek: number
  lastWorkout: string | null
  streakWeeks: number
}
type StrengthPR = { exerciseId: string; name: string; startWeight: number; currentWeight: number; currentReps: number; pctChange: number; lastDate: string }
type Milestone = { date: string; title: string; icon: string; subtitle?: string }

export default function ProgressClient() {
  const [loading, setLoading] = useState(true)
  const [weightData, setWeightData] = useState<WeightPoint[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({ total: 0, thisWeek: 0, lastWorkout: null, streakWeeks: 0 })
  const [strengthPRs, setStrengthPRs] = useState<StrengthPR[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [clientStartDate, setClientStartDate] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [checkInsRes, snapshotsRes, logsRes, progRes] = await Promise.allSettled([
          fetch("/api/coaching/check-in").then((r) => r.json()),
          fetch("/api/coaching/progress").then((r) => r.json()),
          fetch("/api/coaching/workout-log").then((r) => r.json()),
          fetch("/api/coaching/program").then((r) => r.json()),
        ])

        const startDate = progRes.status === "fulfilled" ? (progRes.value.client?.startDate ?? null) : null
        setClientStartDate(startDate)

        if (logsRes.status === "fulfilled") {
          const logs: WorkoutLog[] = (logsRes.value.logs ?? []).map((l: Record<string, unknown>) => ({
            completedAt: l.completedAt as string,
            weekNumber: Number(l.weekNumber),
            dayLabel: l.dayLabel as string,
            setData: l.setData as string | undefined,
          }))
          const now = new Date()
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          startOfWeek.setHours(0, 0, 0, 0)

          const sorted = [...logs].sort((a, b) => b.completedAt.localeCompare(a.completedAt))
          const thisWeek = logs.filter((l) => new Date(l.completedAt) >= startOfWeek).length

          // Streak: count consecutive ISO weeks ending this week with ≥1 workout
          function isoWeekKey(d: Date) {
            const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
            t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
            const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
            const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
            return `${t.getUTCFullYear()}-${week}`
          }
          const weeksWithWorkouts = new Set(logs.map((l) => isoWeekKey(new Date(l.completedAt))))
          let streak = 0
          const cursor = new Date(now)
          while (weeksWithWorkouts.has(isoWeekKey(cursor))) {
            streak++
            cursor.setDate(cursor.getDate() - 7)
          }

          setWorkoutStats({
            total: logs.length,
            thisWeek,
            lastWorkout: sorted[0]?.completedAt ?? null,
            streakWeeks: streak,
          })

          // Strength progress: per exercise, find first weight ever lifted and current best
          const sortedAsc = [...logs].sort((a, b) => a.completedAt.localeCompare(b.completedAt))
          const byEx: Record<string, { name: string; firstWeight: number; firstReps: number; bestWeight: number; bestReps: number; lastDate: string }> = {}
          for (const log of sortedAsc) {
            if (!log.setData) continue
            let sets: Array<{ exerciseId?: string; exerciseName?: string; weight?: string | number; reps?: string | number; completed?: boolean }> = []
            try { sets = JSON.parse(log.setData) } catch { continue }
            for (const s of sets) {
              const w = Number(s.weight)
              const r = Number(s.reps)
              if (!s.exerciseId || !w || !r) continue
              if (s.completed === false) continue
              const cur = byEx[s.exerciseId]
              if (!cur) {
                byEx[s.exerciseId] = { name: s.exerciseName ?? "", firstWeight: w, firstReps: r, bestWeight: w, bestReps: r, lastDate: log.completedAt }
              } else {
                if (w > cur.bestWeight || (w === cur.bestWeight && r > cur.bestReps)) {
                  byEx[s.exerciseId] = { ...cur, bestWeight: w, bestReps: r, lastDate: log.completedAt }
                }
              }
            }
          }
          const prs: StrengthPR[] = Object.entries(byEx)
            .filter(([, v]) => v.bestWeight > v.firstWeight)
            .map(([id, v]) => ({
              exerciseId: id,
              name: v.name,
              startWeight: v.firstWeight,
              currentWeight: v.bestWeight,
              currentReps: v.bestReps,
              pctChange: +(((v.bestWeight - v.firstWeight) / v.firstWeight) * 100).toFixed(0),
              lastDate: v.lastDate,
            }))
            .sort((a, b) => b.pctChange - a.pctChange)
            .slice(0, 6)
          setStrengthPRs(prs)

          // Milestones: auto-derived from logs + start date
          const milestoneList: Milestone[] = []
          if (startDate) {
            milestoneList.push({ date: startDate, title: "Started coaching", icon: "🚀", subtitle: "Day one — welcome to the journey" })
          }
          if (sortedAsc[0]) {
            milestoneList.push({ date: sortedAsc[0].completedAt, title: "First workout logged", icon: "💪" })
          }
          for (const milestone of [10, 25, 50, 100, 200]) {
            if (logs.length >= milestone) {
              const m = sortedAsc[milestone - 1]
              milestoneList.push({ date: m.completedAt, title: `${milestone} workouts completed`, icon: milestone >= 100 ? "🏆" : "🎯" })
            }
          }
          for (const wks of [4, 8, 12, 24, 52]) {
            if (streak >= wks) {
              milestoneList.push({ date: new Date().toISOString(), title: `${wks} week streak`, icon: "🔥" })
              break
            }
          }
          setMilestones(milestoneList.sort((a, b) => b.date.localeCompare(a.date)))
        }

        if (checkInsRes.status === "fulfilled") {
          const allCheckIns: Array<Record<string, unknown>> = checkInsRes.value.checkIns ?? []
          const ciList = allCheckIns
            .filter((ci) => ci.weight)
            .sort((a, b) => (a.submittedAt as string).localeCompare(b.submittedAt as string))
          setWeightData(ciList.map((ci) => ({ date: ci.submittedAt as string, weight: Number(ci.weight), unit: (ci.weightUnit as string) ?? "lbs" })))

          // Additional milestones from weight check-ins
          const sortedAll = [...allCheckIns].sort((a, b) => (a.submittedAt as string).localeCompare(b.submittedAt as string))
          if (sortedAll[0]) {
            setMilestones((prev) => [...prev, { date: sortedAll[0].submittedAt as string, title: "First check-in submitted", icon: "✍️" }])
          }
          if (ciList.length >= 2) {
            const start = Number(ciList[0].weight)
            const last = Number(ciList[ciList.length - 1].weight)
            const unit = (ciList[0].weightUnit as string) ?? "lbs"
            const lost = +(start - last).toFixed(1)
            const thresholds = [5, 10, 15, 20, 25, 30]
            for (const t of thresholds) {
              if (lost >= t) {
                // Find first time the threshold was crossed
                const crossingPoint = ciList.find((ci) => start - Number(ci.weight) >= t)
                if (crossingPoint) {
                  setMilestones((prev) => prev.some((m) => m.title === `Lost first ${t} ${unit}`) ? prev : [...prev, { date: crossingPoint.submittedAt as string, title: `Lost first ${t} ${unit}`, icon: "📉" }])
                }
              }
            }
          }
        }

        if (snapshotsRes.status === "fulfilled") {
          const snaps: Array<Record<string, unknown>> = snapshotsRes.value.snapshots ?? []
          setSnapshots(
            snaps
              .sort((a, b) => (b.snapshotDate as string).localeCompare(a.snapshotDate as string))
              .map((s) => ({
                id: s.id as string,
                snapshotDate: s.snapshotDate as string,
                weight: s.weight != null ? Number(s.weight) : null,
                weightUnit: (s.weightUnit as string | null) ?? null,
                waist: s.waist != null ? Number(s.waist) : null,
                hips: s.hips != null ? Number(s.hips) : null,
                chest: s.chest != null ? Number(s.chest) : null,
                arm: s.arm != null ? Number(s.arm) : null,
                thigh: s.thigh != null ? Number(s.thigh) : null,
                notes: (s.notes as string | null) ?? null,
              }))
          )
        }
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>Your</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, margin: 0 }}>Progress</h1>
        </div>
        <Link href="/my-coaching/progress/log" style={{ display: "inline-block", background: black, color: white, padding: "10px 22px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
          + Log Measurements
        </Link>
      </div>

      {/* Workout stats */}
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem", marginBottom: "1.25rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 16px" }}>
          Training Activity
        </p>
        {workoutStats.total === 0 ? (
          <div style={{ background: "#faf8f5", borderRadius: 6, padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, margin: "0 0 10px" }}>
              No workouts logged yet — start your first one to build a streak.
            </p>
            <Link href="/my-coaching/workouts" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: accent, textDecoration: "none", fontWeight: 600 }}>
              Go to workouts →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Total Workouts</p>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: 0 }}>{workoutStats.total}</p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>This Week</p>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: workoutStats.thisWeek > 0 ? "#5c9e6a" : black, margin: 0 }}>{workoutStats.thisWeek}</p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Week Streak</p>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: workoutStats.streakWeeks > 0 ? accent : black, margin: 0 }}>
                {workoutStats.streakWeeks} {workoutStats.streakWeeks > 0 && <span style={{ fontSize: "1rem" }}>🔥</span>}
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Last Workout</p>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.1rem", fontWeight: 700, color: black, margin: "8px 0 0", lineHeight: 1.2 }}>
                {workoutStats.lastWorkout
                  ? new Date(workoutStats.lastWorkout).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Weight chart */}
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem", marginBottom: "1.25rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 16px" }}>
          Weight Trend — from weekly check-ins
        </p>
        <WeightChart data={weightData} />
        {weightData.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <Link href="/my-coaching/check-in" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: accent, textDecoration: "none", fontWeight: 600 }}>
              Submit your first check-in →
            </Link>
          </div>
        )}
      </div>

      {/* Strength Progress */}
      {strengthPRs.length > 0 && (
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem", marginBottom: "1.25rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 16px" }}>
            Strength Progress 💪
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {strengthPRs.map((pr) => (
              <div key={pr.exerciseId} style={{ background: "#fdf9f4", border: `1px solid #f0e8dc`, borderRadius: 6, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", fontWeight: 700, color: black, margin: 0 }}>{pr.name}</p>
                  <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, color: "#5c9e6a" }}>+{pr.pctChange}%</span>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 2px" }}>Started</p>
                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, margin: 0, textDecoration: "line-through" }}>{pr.startWeight}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", color: accent, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 2px" }}>Now</p>
                    <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.2rem", fontWeight: 700, color: accent, margin: 0 }}>{pr.currentWeight} <span style={{ fontSize: "0.7rem", color: muted, fontWeight: 400 }}>× {pr.currentReps}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: muted, margin: "12px 0 0", fontStyle: "italic" }}>
            Top exercises where you&apos;ve added the most weight since you started.
          </p>
        </div>
      )}

      {/* Measurement snapshots */}
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: 0 }}>
            Measurement History
          </p>
          {snapshots.length > 0 && (
            <Link href="/my-coaching/progress/log" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: accent, textDecoration: "none", fontWeight: 600 }}>
              + Log today
            </Link>
          )}
        </div>

        {snapshots.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 16px", lineHeight: 1.5 }}>
              Log your measurements to track body composition over time.
            </p>
            <Link href="/my-coaching/progress/log" style={{ display: "inline-block", background: accent, color: black, padding: "11px 24px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
              Log First Measurements
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {snapshots.map((s, i) => (
              <div key={s.id} style={{ background: i === 0 ? "#fdf9f4" : "#faf8f5", border: `1px solid ${i === 0 ? "#f0e4cc" : border}`, borderRadius: 6, padding: "1rem 1.25rem" }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: i === 0 ? accent : muted, margin: "0 0 10px" }}>
                  {i === 0 ? "Most Recent — " : ""}{new Date(s.snapshotDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
                {s.weight && <MeasRow label="Weight" value={s.weight} unit={s.weightUnit ?? "lbs"} />}
                <MeasRow label="Waist" value={s.waist} />
                <MeasRow label="Hips" value={s.hips} />
                <MeasRow label="Chest" value={s.chest} />
                <MeasRow label="Arm" value={s.arm} />
                <MeasRow label="Thigh" value={s.thigh} />
                {s.notes && <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, marginTop: 8 }}>{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestone timeline */}
      {milestones.length > 0 && (
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem", marginTop: "1.25rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 18px" }}>
            Your Journey
          </p>
          <div style={{ position: "relative", paddingLeft: 24 }}>
            <div style={{ position: "absolute", left: 11, top: 6, bottom: 6, width: 2, background: `${accent}33` }} />
            {milestones.map((m, i) => (
              <div key={i} style={{ position: "relative", marginBottom: i === milestones.length - 1 ? 0 : 18 }}>
                <div style={{ position: "absolute", left: -19, top: 4, width: 22, height: 22, borderRadius: "50%", background: white, border: `2px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>
                  {m.icon}
                </div>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: accent, margin: "0 0 2px" }}>
                  {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1rem", fontWeight: 700, color: black, margin: 0 }}>{m.title}</p>
                {m.subtitle && <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, margin: "2px 0 0", fontStyle: "italic" }}>{m.subtitle}</p>}
              </div>
            ))}
          </div>
          {clientStartDate && milestones.length < 3 && (
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, margin: "18px 0 0", fontStyle: "italic" }}>
              More milestones unlock as you progress. Keep going.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
