"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useParams } from "next/navigation"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"
const green = "#5c9e6a"
const red = "#d97460"
const CDN = process.env.NEXT_PUBLIC_AMBRISA_CDN_URL ?? ""

type SetEntry = {
  exerciseId: string
  exerciseName?: string
  setNumber: number
  weight: string
  reps: string
  rpe: string
  notes?: string
  completed: boolean
}

type WorkoutLog = {
  id: string
  clientEmail: string
  programId: string
  weekNumber: number
  dayLabel: string
  completedAt: string
  setData: string
  overallRpe?: number
  energyLevel?: number
  clientNotes?: string
  coachFeedback?: string
  coachFeedbackAt?: string
}

type ProgramExercise = { exerciseId: string; name: string; videoS3Key: string; sets: string; reps: string; weight: string; rpe: string }
type ProgramDay = { dayLabel: string; exercises: ProgramExercise[] }
type ProgramWeek = { weekNumber: number; days: ProgramDay[] }

// ── Helpers ────────────────────────────────────────────────────────────────

function parseNum(s: string | undefined): number {
  if (!s) return 0
  const n = parseFloat(s.replace(/[^\d.-]/g, ""))
  return isNaN(n) ? 0 : n
}

function daysAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86_400_000)
  if (d === 0) return "today"
  if (d === 1) return "yesterday"
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}

function startOfIsoWeek(d: Date): Date {
  const day = d.getDay() || 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day - 1))
  monday.setHours(0, 0, 0, 0)
  return monday
}

type WeekProgress = {
  workoutsThisWeek: number
  workoutsLastWeek: number
  volumeThisWeek: number
  volumeLastWeek: number
  volumeDeltaPct: number | null
  improvements: Array<{ exercise: string; delta: string }>
  declines: Array<{ exercise: string; delta: string }>
  missed: string[]
  hasData: boolean
}

function computeWeekProgress(logs: WorkoutLog[]): WeekProgress {
  const now = new Date()
  const thisWeekStart = startOfIsoWeek(now).toISOString()
  const lastWeekStart = startOfIsoWeek(new Date(now.getTime() - 7 * 86_400_000)).toISOString()

  const thisWeek = logs.filter((l) => l.completedAt >= thisWeekStart)
  const lastWeek = logs.filter((l) => l.completedAt >= lastWeekStart && l.completedAt < thisWeekStart)

  // Per-exercise max weight and max reps for each week
  type Best = { weight: number; reps: number; exerciseName: string }
  function bestsForLogs(week: WorkoutLog[]): Map<string, Best> {
    const bests = new Map<string, Best>()
    for (const log of week) {
      let sets: SetEntry[] = []
      try { sets = JSON.parse(log.setData) as SetEntry[] } catch { continue }
      for (const s of sets) {
        if (!s.completed) continue
        const w = parseNum(s.weight)
        const r = parseNum(s.reps)
        const key = s.exerciseId
        const cur = bests.get(key)
        const name = s.exerciseName ?? key
        if (!cur) {
          bests.set(key, { weight: w, reps: r, exerciseName: name })
        } else {
          bests.set(key, { weight: Math.max(cur.weight, w), reps: Math.max(cur.reps, r), exerciseName: name })
        }
      }
    }
    return bests
  }

  function volumeForLogs(week: WorkoutLog[]): number {
    let total = 0
    for (const log of week) {
      let sets: SetEntry[] = []
      try { sets = JSON.parse(log.setData) as SetEntry[] } catch { continue }
      for (const s of sets) {
        if (!s.completed) continue
        total += parseNum(s.weight) * parseNum(s.reps)
      }
    }
    return total
  }

  const thisBests = bestsForLogs(thisWeek)
  const lastBests = bestsForLogs(lastWeek)

  const improvements: Array<{ exercise: string; delta: string }> = []
  const declines: Array<{ exercise: string; delta: string }> = []

  for (const [id, cur] of thisBests) {
    const prev = lastBests.get(id)
    if (!prev) continue
    const dW = cur.weight - prev.weight
    const dR = cur.reps - prev.reps
    if (dW > 0) improvements.push({ exercise: cur.exerciseName, delta: `+${dW.toFixed(dW % 1 ? 1 : 0)} lb` })
    else if (dR > 0) improvements.push({ exercise: cur.exerciseName, delta: `+${dR} reps` })
    else if (dW < 0) declines.push({ exercise: cur.exerciseName, delta: `${dW.toFixed(dW % 1 ? 1 : 0)} lb` })
    else if (dR < 0) declines.push({ exercise: cur.exerciseName, delta: `${dR} reps` })
  }

  const volumeThisWeek = volumeForLogs(thisWeek)
  const volumeLastWeek = volumeForLogs(lastWeek)
  const volumeDeltaPct = volumeLastWeek > 0
    ? ((volumeThisWeek - volumeLastWeek) / volumeLastWeek) * 100
    : null

  return {
    workoutsThisWeek: thisWeek.length,
    workoutsLastWeek: lastWeek.length,
    volumeThisWeek,
    volumeLastWeek,
    volumeDeltaPct,
    improvements: improvements.slice(0, 5),
    declines: declines.slice(0, 5),
    missed: [],
    hasData: thisWeek.length > 0 || lastWeek.length > 0,
  }
}

// ── Per-exercise progress across all logs ──────────────────────────────────

type ExerciseTrend = {
  exerciseId: string
  name: string
  sessions: number
  firstWeight: number
  latestWeight: number
  firstReps: number
  latestReps: number
  firstDate: string
  latestDate: string
}

function computeExerciseProgress(logs: WorkoutLog[]): ExerciseTrend[] {
  // Bucket sets by exercise, keyed by exerciseId
  const buckets = new Map<string, Array<{ name: string; date: string; maxWeight: number; maxReps: number }>>()
  for (const log of logs) {
    let sets: SetEntry[] = []
    try { sets = JSON.parse(log.setData) as SetEntry[] } catch { continue }
    // Per exercise per workout: take max weight and max reps for that workout
    const perExerciseMax = new Map<string, { name: string; maxWeight: number; maxReps: number }>()
    for (const s of sets) {
      if (!s.completed) continue
      const w = parseNum(s.weight)
      const r = parseNum(s.reps)
      const name = s.exerciseName ?? s.exerciseId
      const cur = perExerciseMax.get(s.exerciseId)
      if (!cur) perExerciseMax.set(s.exerciseId, { name, maxWeight: w, maxReps: r })
      else perExerciseMax.set(s.exerciseId, { name, maxWeight: Math.max(cur.maxWeight, w), maxReps: Math.max(cur.maxReps, r) })
    }
    for (const [id, { name, maxWeight, maxReps }] of perExerciseMax) {
      if (!buckets.has(id)) buckets.set(id, [])
      buckets.get(id)!.push({ name, date: log.completedAt, maxWeight, maxReps })
    }
  }

  const trends: ExerciseTrend[] = []
  for (const [exerciseId, records] of buckets) {
    if (records.length === 0) continue
    // records already come from logs sorted newest-first; reverse for oldest-first
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
    const first = sorted[0]
    const latest = sorted[sorted.length - 1]
    trends.push({
      exerciseId,
      name: latest.name,
      sessions: sorted.length,
      firstWeight: first.maxWeight,
      latestWeight: latest.maxWeight,
      firstReps: first.maxReps,
      latestReps: latest.maxReps,
      firstDate: first.date,
      latestDate: latest.date,
    })
  }

  // Sort by most-tracked first, then largest delta
  return trends.sort((a, b) => {
    if (b.sessions !== a.sessions) return b.sessions - a.sessions
    const aDelta = a.latestWeight - a.firstWeight
    const bDelta = b.latestWeight - b.firstWeight
    return Math.abs(bDelta) - Math.abs(aDelta)
  })
}

function ExerciseProgressCard({ trends }: { trends: ExerciseTrend[] }) {
  if (trends.length === 0) return null
  const shown = trends.slice(0, 10)

  return (
    <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>
        Progress by exercise
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {shown.map((t) => {
          const weightDelta = t.latestWeight - t.firstWeight
          const repsDelta = t.latestReps - t.firstReps
          const showWeight = t.latestWeight > 0 || t.firstWeight > 0
          const showReps = t.latestReps > 0 && !showWeight
          const primaryDelta = showWeight ? weightDelta : repsDelta
          const primaryUnit = showWeight ? "lb" : "reps"
          const arrow = primaryDelta > 0 ? "↗" : primaryDelta < 0 ? "↘" : "→"
          const arrowColor = primaryDelta > 0 ? green : primaryDelta < 0 ? red : muted
          const deltaText = primaryDelta === 0
            ? "stable"
            : `${primaryDelta > 0 ? "+" : ""}${primaryDelta.toFixed(primaryDelta % 1 ? 1 : 0)} ${primaryUnit}`
          return (
            <div key={t.exerciseId} style={{ padding: "8px 10px", background: "#0f0f0f", border: `1px solid ${border}`, borderLeft: `3px solid ${arrowColor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 600, color: cream, minWidth: 0, flex: "1 1 140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </span>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", fontWeight: 700, color: arrowColor, letterSpacing: "0.04em", flexShrink: 0 }}>
                  {arrow} {deltaText}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                {showWeight && (
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted }}>
                    <span style={{ color: "#555", textTransform: "uppercase", fontSize: "0.55rem", letterSpacing: "0.08em" }}>Weight </span>
                    {t.firstWeight} → {t.latestWeight}
                  </span>
                )}
                {showReps && (
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted }}>
                    <span style={{ color: "#555", textTransform: "uppercase", fontSize: "0.55rem", letterSpacing: "0.08em" }}>Reps </span>
                    {t.firstReps} → {t.latestReps}
                  </span>
                )}
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted }}>
                  <span style={{ color: "#555", textTransform: "uppercase", fontSize: "0.55rem", letterSpacing: "0.08em" }}>Sessions </span>
                  {t.sessions}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      {trends.length > shown.length && (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: muted, margin: "10px 0 0", textAlign: "center" }}>
          + {trends.length - shown.length} more exercises tracked
        </p>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProgressPreview({ progress }: { progress: WeekProgress }) {
  if (!progress.hasData) {
    return (
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.25rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.1rem", color: muted, margin: 0 }}>
          No workouts logged yet.
        </p>
      </div>
    )
  }
  return (
    <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>
        This week vs last
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 3px" }}>Workouts</p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.6rem", color: cream, margin: 0, lineHeight: 1 }}>
            {progress.workoutsThisWeek}
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, marginLeft: 8 }}>vs {progress.workoutsLastWeek} last</span>
          </p>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 3px" }}>Volume</p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.6rem", color: cream, margin: 0, lineHeight: 1 }}>
            {Math.round(progress.volumeThisWeek).toLocaleString()}
            {progress.volumeDeltaPct !== null && (
              <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: progress.volumeDeltaPct >= 0 ? green : red, marginLeft: 8 }}>
                {progress.volumeDeltaPct >= 0 ? "+" : ""}{Math.round(progress.volumeDeltaPct)}%
              </span>
            )}
          </p>
        </div>
      </div>

      {progress.improvements.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, color: green, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
            ↑ Improvements
          </p>
          {progress.improvements.map((imp, i) => (
            <p key={i} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: cream, margin: "2px 0" }}>
              {imp.exercise} <span style={{ color: green, fontWeight: 700, marginLeft: 6 }}>{imp.delta}</span>
            </p>
          ))}
        </div>
      )}

      {progress.declines.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, color: red, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
            ↓ Went down
          </p>
          {progress.declines.map((d, i) => (
            <p key={i} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: cream, margin: "2px 0" }}>
              {d.exercise} <span style={{ color: red, fontWeight: 700, marginLeft: 6 }}>{d.delta}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function WorkoutCard({
  log, program, onFeedbackSaved,
}: {
  log: WorkoutLog
  program: ProgramWeek[] | null
  onFeedbackSaved: (id: string, feedback: string, at: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState(log.coachFeedback ?? "")
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const sets: SetEntry[] = useMemo(() => {
    try { return JSON.parse(log.setData) as SetEntry[] } catch { return [] }
  }, [log.setData])

  const totalSets = sets.length
  const completedSets = sets.filter((s) => s.completed).length
  const exerciseCount = new Set(sets.map((s) => s.exerciseId)).size

  // Group sets by exercise
  const byExercise = useMemo(() => {
    const map = new Map<string, { name: string; entries: SetEntry[] }>()
    for (const s of sets) {
      const cur = map.get(s.exerciseId)
      if (cur) cur.entries.push(s)
      else map.set(s.exerciseId, { name: s.exerciseName ?? s.exerciseId, entries: [s] })
    }
    return Array.from(map.entries())
  }, [sets])

  // Find prescribed values for this workout day (for compare)
  const prescribed = useMemo(() => {
    const map = new Map<string, ProgramExercise>()
    if (!program) return map
    const week = program.find((w) => w.weekNumber === log.weekNumber)
    if (!week) return map
    const day = week.days.find((d) => d.dayLabel === log.dayLabel)
    if (!day) return map
    for (const e of day.exercises) map.set(e.exerciseId, e)
    return map
  }, [program, log.weekNumber, log.dayLabel])

  async function saveFeedback() {
    setSaving(true)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) return
      const res = await fetch(`/api/admin/coaching/workout-logs/${log.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ coachFeedback: feedback }),
      })
      const data = await res.json() as { ok?: boolean; coachFeedbackAt?: string }
      if (data.ok && data.coachFeedbackAt) {
        onFeedbackSaved(log.id, feedback, data.coachFeedbackAt)
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 2000)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  return (
    <div style={{ background: "#161616", border: `1px solid ${border}`, marginBottom: 10 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", background: "transparent", border: "none", cursor: "pointer",
          padding: "12px 16px", textAlign: "left",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: cream, margin: "0 0 3px" }}>
            {formatDate(log.completedAt)} · {log.dayLabel}
          </p>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted, margin: 0 }}>
            Week {log.weekNumber} · {exerciseCount} exercises · {completedSets}/{totalSets} sets{log.overallRpe ? ` · RPE ${log.overallRpe}` : ""}
          </p>
          {log.clientNotes && (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#aaa", margin: "3px 0 0", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              &ldquo;{log.clientNotes.length > 70 ? log.clientNotes.slice(0, 70) + "…" : log.clientNotes}&rdquo;
            </p>
          )}
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {log.coachFeedback ? (
            <span style={{ background: gold, color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em", padding: "3px 8px" }}>
              ✓ FEEDBACK
            </span>
          ) : (
            <span style={{ border: `1px solid ${border}`, color: muted, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em", padding: "3px 8px" }}>
              NO FEEDBACK
            </span>
          )}
          <span style={{ color: muted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", display: "inline-flex" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke={muted} strokeWidth="1.4" strokeLinecap="round" /></svg>
          </span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${border}` }}>
          {byExercise.map(([id, ex]) => {
            const p = prescribed.get(id)
            return (
              <div key={id} style={{ marginTop: 12, background: "#0f0f0f", border: `1px solid ${border}`, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  {p?.videoS3Key && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`${CDN}/${encodeURIComponent(p.videoS3Key.replace(/\.mp4$/i, ".jpg"))}`}
                      alt=""
                      style={{ width: 32, height: 32, objectFit: "cover", flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", fontWeight: 600, color: cream, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ex.name}
                    </p>
                    {p && (
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: muted, margin: "2px 0 0" }}>
                        Prescribed: {p.sets}×{p.reps}{p.weight ? ` @ ${p.weight}` : ""}{p.rpe ? ` RPE ${p.rpe}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr 40px", gap: 6, alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${border}` }}>
                  {["Set", "Weight", "Reps", "RPE", "✓"].map((h) => (
                    <span key={h} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.5rem", fontWeight: 700, color: muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</span>
                  ))}
                </div>
                {ex.entries.map((s, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr 40px", gap: 6, alignItems: "center", padding: "5px 0", borderBottom: i === ex.entries.length - 1 ? "none" : `1px solid #1e1e1e` }}>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted }}>{s.setNumber}</span>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: cream, fontWeight: 600 }}>{s.weight || "—"}</span>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: cream, fontWeight: 600 }}>{s.reps || "—"}</span>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted }}>{s.rpe || "—"}</span>
                    <span style={{ color: s.completed ? green : "#444", fontSize: "0.8rem" }}>{s.completed ? "✓" : "○"}</span>
                  </div>
                ))}
              </div>
            )
          })}

          {log.clientNotes && (
            <div style={{ marginTop: 14, padding: "10px 12px", borderLeft: `2px solid ${gold}`, background: "#0f0f0f" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, color: gold, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
                Client note
              </p>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: cream, margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>
                &ldquo;{log.clientNotes}&rdquo;
              </p>
            </div>
          )}

          {/* Coach feedback textarea */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: gold }}>
                Comment for the client on this workout
              </label>
              {log.coachFeedbackAt && (
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.08em" }}>
                  sent {daysAgo(log.coachFeedbackAt)}
                </span>
              )}
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="e.g. Great work — bump squat to 145 next week, drop RPE target to 8."
              style={{
                width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: cream,
                padding: "10px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem",
                outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              <button
                onClick={saveFeedback}
                disabled={saving}
                style={{
                  background: saving ? "#555" : gold, color: "#0a0a0a", border: "none",
                  padding: "8px 18px", fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                {saving ? "Saving…" : log.coachFeedback ? "Update comment" : "Send comment"}
              </button>
              {savedFlash && (
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: green, fontWeight: 600 }}>
                  ✓ Saved
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AdminClientWorkoutsPage() {
  const params = useParams()
  const emailParam = decodeURIComponent(params.email as string)

  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState("")
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [program, setProgram] = useState<ProgramWeek[] | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setLoading(false); return }

      // Client + program
      const clientRes = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (clientRes.ok) {
        const data = await clientRes.json() as { client: { displayName?: string; currentProgramId?: string } }
        if (data.client?.displayName) setClientName(data.client.displayName)
        if (data.client?.currentProgramId) {
          const pRes = await fetch(`/api/admin/coaching/programs/${data.client.currentProgramId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (pRes.ok) {
            const p = await pRes.json() as { program?: { weeks?: string } }
            if (p.program?.weeks) {
              try { setProgram(JSON.parse(p.program.weeks) as ProgramWeek[]) } catch { /* ignore */ }
            }
          }
        }
      }

      // Workout logs
      const logsRes = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}/workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (logsRes.ok) {
        const data = await logsRes.json() as { logs: WorkoutLog[] }
        setLogs(data.logs ?? [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [emailParam])

  useEffect(() => { load() }, [load])

  const progress = useMemo(() => computeWeekProgress(logs), [logs])
  const exerciseTrends = useMemo(() => computeExerciseProgress(logs), [logs])

  function handleFeedbackSaved(id: string, feedback: string, at: string) {
    setLogs((cur) => cur.map((l) => l.id === id ? { ...l, coachFeedback: feedback, coachFeedbackAt: at } : l))
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem", color: muted }}>
        <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading…</span>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <Link href={`/admin/coaching/clients/${encodeURIComponent(emailParam)}`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none" }}>
          ← {clientName || emailParam}
        </Link>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: cream, margin: 0, flex: 1 }}>
          Workouts
        </h1>
      </div>

      <ProgressPreview progress={progress} />

      <ExerciseProgressCard trends={exerciseTrends} />

      {logs.length === 0 ? (
        <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "2.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", color: muted, margin: 0 }}>
            No workouts logged yet.
          </p>
        </div>
      ) : (
        logs.map((log) => (
          <WorkoutCard key={log.id} log={log} program={program} onFeedbackSaved={handleFeedbackSaved} />
        ))
      )}
    </div>
  )
}
