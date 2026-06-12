"use client"

import { useState, useEffect } from "react"
import { fetchUserAttributes } from "aws-amplify/auth"
import Link from "next/link"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

type ProgramDay = { dayLabel: string; notes: string; exercises: { exerciseId: string; name: string; sets: string; reps: string; weight: string }[] }
type ProgramWeek = { weekNumber: number; label: string; days: ProgramDay[] }

type ClientInfo = {
  displayName: string
  goal: string | null
  currentProgramId: string | null
  startDate: string | null
  weightUnit: "LBS" | "KG"
  coachMessage: string | null
  coachMessageUpdatedAt: string | null
}

type ProgramInfo = {
  id: string
  name: string
  weeks: ProgramWeek[]
}

type WorkoutLog = {
  weekNumber: number
  dayLabel: string
  completedAt: string
  setData?: string
}

type Goal = {
  id: string
  type: string
  label: string | null
  startValue: number | null
  targetValue: number | null
  currentValue: number | null
  unit: string | null
  status: string | null
}

type CheckIn = { submittedAt: string; weight: number | null; weightUnit: string | null }

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function goalProgressPct(g: Goal): number | null {
  if (g.startValue == null || g.targetValue == null || g.currentValue == null) return null
  const span = g.targetValue - g.startValue
  if (span === 0) return g.currentValue === g.targetValue ? 100 : 0
  const traveled = g.currentValue - g.startValue
  const pct = (traveled / span) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

function fmtVal(v: number | null, unit: string | null) {
  if (v == null) return "—"
  return `${v}${unit ? ` ${unit}` : ""}`
}

export default function MyCoachingHomeClient() {
  const [loading, setLoading] = useState(true)
  const [, setEmail] = useState("")
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [program, setProgram] = useState<ProgramInfo | null>(null)
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [primaryGoal, setPrimaryGoal] = useState<Goal | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])

  useEffect(() => {
    async function load() {
      try {
        const attrs = await fetchUserAttributes()
        const userEmail = attrs.email ?? ""
        setEmail(userEmail)

        const [programRes, logsRes, goalsRes, ciRes] = await Promise.allSettled([
          fetch("/api/coaching/program").then((r) => r.json()),
          fetch("/api/coaching/workout-log").then((r) => r.json()),
          fetch("/api/coaching/goals").then((r) => r.json()),
          fetch("/api/coaching/check-in").then((r) => r.json()),
        ])

        if (programRes.status === "fulfilled") {
          const c = programRes.value.client
          const prog = programRes.value.program
          if (c) {
            setClientInfo({
              displayName: c.displayName,
              goal: c.goal ?? null,
              currentProgramId: c.currentProgramId ?? null,
              startDate: c.startDate ?? null,
              weightUnit: (c.weightUnit ?? "LBS") as "LBS" | "KG",
              coachMessage: c.coachMessage ?? null,
              coachMessageUpdatedAt: c.coachMessageUpdatedAt ?? null,
            })
          }
          if (prog) {
            try {
              setProgram({ id: prog.id, name: prog.name, weeks: JSON.parse(prog.weeks) as ProgramWeek[] })
            } catch { /* invalid JSON */ }
          }
        }

        if (logsRes.status === "fulfilled") {
          setLogs((logsRes.value.logs ?? []).map((l: Record<string, unknown>) => ({
            weekNumber: Number(l.weekNumber),
            dayLabel: l.dayLabel as string,
            completedAt: l.completedAt as string,
            setData: l.setData as string | undefined,
          })))
        }

        if (goalsRes.status === "fulfilled") {
          const goals: Goal[] = (goalsRes.value.goals ?? []).map((g: Record<string, unknown>) => ({
            id: g.id as string,
            type: g.type as string,
            label: (g.label as string | null) ?? null,
            startValue: g.startValue != null ? Number(g.startValue) : null,
            targetValue: g.targetValue != null ? Number(g.targetValue) : null,
            currentValue: g.currentValue != null ? Number(g.currentValue) : null,
            unit: (g.unit as string | null) ?? null,
            status: (g.status as string | null) ?? null,
          }))
          // Pick first non-achieved or first one as the headline goal
          const headline = goals.find((g) => g.status !== "ACHIEVED") ?? goals[0] ?? null
          setPrimaryGoal(headline)
        }

        if (ciRes.status === "fulfilled") {
          setCheckIns((ciRes.value.checkIns ?? []).map((ci: Record<string, unknown>) => ({
            submittedAt: ci.submittedAt as string,
            weight: ci.weight != null ? Number(ci.weight) : null,
            weightUnit: (ci.weightUnit as string | null) ?? null,
          })))
        }
      } catch { /* auth error handled by layout */ }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spinner />

  const firstName = clientInfo?.displayName.split(" ")[0] ?? ""

  // ── Compute outcome-focused metrics ────────────────────────────────────────
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const thisWeekLogs = logs.filter((l) => new Date(l.completedAt) >= startOfWeek)

  // Weekly adherence: % of scheduled days completed this week vs. days in current week of program
  const currentWeekNum = thisWeekLogs[0] ? thisWeekLogs[0].weekNumber : (program?.weeks[0]?.weekNumber ?? 1)
  const scheduledThisWeek = program?.weeks.find((w) => w.weekNumber === currentWeekNum)?.days.length ?? 0
  const adherence = scheduledThisWeek > 0 ? Math.min(100, Math.round((thisWeekLogs.length / scheduledThisWeek) * 100)) : 0

  // Streak: consecutive ISO weeks ending now with ≥1 workout
  function isoWeekKey(d: Date) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
    const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return `${t.getUTCFullYear()}-${week}`
  }
  const weeksWith = new Set(logs.map((l) => isoWeekKey(new Date(l.completedAt))))
  let streak = 0
  const cursor = new Date()
  while (weeksWith.has(isoWeekKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 7) }

  // Weight trend: latest vs. first check-in weight
  const weighIns = checkIns.filter((c) => c.weight != null).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  const weightDelta = weighIns.length >= 2 ? +(weighIns[weighIns.length - 1].weight! - weighIns[0].weight!).toFixed(1) : null
  const weightUnit = weighIns[0]?.weightUnit ?? clientInfo?.weightUnit?.toLowerCase() ?? "lbs"

  // Latest PR: scan recent workout logs for highest weight×reps per exercise, compare with prior
  type PRRow = { exerciseId: string; name: string; weight: number; reps: number; delta: number; date: string }
  const prByEx: Record<string, { best: { weight: number; reps: number; date: string }; prev: { weight: number; reps: number } | null; name: string }> = {}
  const sortedLogs = [...logs].sort((a, b) => a.completedAt.localeCompare(b.completedAt))
  for (const log of sortedLogs) {
    if (!log.setData) continue
    let sets: Array<{ exerciseId?: string; exerciseName?: string; weight?: string | number; reps?: string | number }> = []
    try { sets = JSON.parse(log.setData) } catch { continue }
    for (const s of sets) {
      const w = Number(s.weight)
      const r = Number(s.reps)
      if (!s.exerciseId || !w || !r) continue
      const cur = prByEx[s.exerciseId]
      if (!cur) {
        prByEx[s.exerciseId] = { best: { weight: w, reps: r, date: log.completedAt }, prev: null, name: s.exerciseName ?? "" }
      } else if (w > cur.best.weight || (w === cur.best.weight && r > cur.best.reps)) {
        prByEx[s.exerciseId] = { best: { weight: w, reps: r, date: log.completedAt }, prev: cur.best, name: cur.name }
      }
    }
  }
  const recentPRs: PRRow[] = Object.entries(prByEx)
    .filter(([, v]) => v.prev !== null && (v.best.weight > v.prev.weight))
    .map(([id, v]) => ({ exerciseId: id, name: v.name, weight: v.best.weight, reps: v.best.reps, delta: +(v.best.weight - v.prev!.weight).toFixed(1), date: v.best.date }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  // Find next uncompleted day
  const nextWorkout = program ? (() => {
    for (const week of program.weeks) {
      for (let di = 0; di < week.days.length; di++) {
        const day = week.days[di]
        const done = logs.some((l) => l.weekNumber === week.weekNumber && l.dayLabel === day.dayLabel)
        if (!done) return { week, day, dayIndex: di }
      }
    }
    return null
  })() : null

  const goalPct = primaryGoal ? goalProgressPct(primaryGoal) : null

  return (
    <div>
      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, marginBottom: "0.4rem" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long" })}, {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, margin: "0" }}>
          {firstName ? `Welcome back, ${firstName}.` : "Your Coaching Portal"}
        </h1>
      </div>

      {/* ── Section 1: Primary Goal ─────────────────────────────────────── */}
      {primaryGoal ? (
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem 1.75rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, margin: "0 0 6px" }}>Your Goal</p>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: black, margin: 0 }}>
                {primaryGoal.label || primaryGoal.type}
              </h2>
            </div>
            {goalPct !== null && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: goalPct >= 100 ? "#5c9e6a" : accent, margin: 0, lineHeight: 1 }}>{goalPct}%</p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", color: muted, margin: "2px 0 0", letterSpacing: "0.08em" }}>Progress</p>
              </div>
            )}
          </div>

          {goalPct !== null && (
            <div style={{ height: 6, background: "#f0e8dc", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ height: "100%", background: goalPct >= 100 ? "#5c9e6a" : accent, width: `${goalPct}%`, borderRadius: 3, transition: "width 0.4s ease" }} />
            </div>
          )}

          {(primaryGoal.startValue != null || primaryGoal.currentValue != null || primaryGoal.targetValue != null) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Start</p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", fontWeight: 600, color: black, margin: 0 }}>{fmtVal(primaryGoal.startValue, primaryGoal.unit)}</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, margin: "0 0 2px" }}>Current</p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", fontWeight: 700, color: accent, margin: 0 }}>{fmtVal(primaryGoal.currentValue, primaryGoal.unit)}</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Target</p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", fontWeight: 600, color: black, margin: 0 }}>{fmtVal(primaryGoal.targetValue, primaryGoal.unit)}</p>
              </div>
            </div>
          )}
        </div>
      ) : clientInfo?.goal ? (
        <div style={{ background: `${accent}10`, border: `1px solid ${accent}55`, borderRadius: 8, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, margin: "0 0 6px" }}>Working toward</p>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.2rem", fontWeight: 700, color: black, margin: 0 }}>{clientInfo.goal}</p>
        </div>
      ) : null}

      {/* ── Section 2: Today's Workout (Primary CTA) ────────────────────── */}
      {!program ? (
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "2.5rem", textAlign: "center", marginBottom: "1rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fdf6ec", border: `2px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" /></svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: black, margin: "0 0 0.75rem" }}>
            Lisa is building your program
          </h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, maxWidth: 380, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
            You&apos;ll get an email when your personalised program is ready. In the meantime, send Lisa a message with anything you want her to know.
          </p>
          <Link href="/my-coaching/messages" style={{ display: "inline-block", background: accent, color: black, padding: "12px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textDecoration: "none", borderRadius: 4 }}>
            Message Lisa
          </Link>
        </div>
      ) : nextWorkout ? (
        <div style={{ background: black, color: white, borderRadius: 8, padding: "1.75rem 1.75rem", marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 8px" }}>Today&apos;s Workout</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.6rem", fontWeight: 700, color: white, margin: "0 0 8px", lineHeight: 1.2 }}>
            {nextWorkout.week.label} — {nextWorkout.day.dayLabel}
          </h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: "#d4cfc8", margin: "0 0 18px", lineHeight: 1.5 }}>
            {nextWorkout.day.exercises.length} exercise{nextWorkout.day.exercises.length !== 1 ? "s" : ""} · ~{Math.max(20, nextWorkout.day.exercises.length * 8)} min
            {nextWorkout.day.notes ? ` · ${nextWorkout.day.notes}` : ""}
          </p>
          <Link
            href={`/my-coaching/workouts/${nextWorkout.week.weekNumber}/${nextWorkout.dayIndex}`}
            style={{ display: "inline-block", background: accent, color: black, padding: "14px 32px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.08em", textDecoration: "none", borderRadius: 4 }}
          >
            Start Workout →
          </Link>
        </div>
      ) : (
        <div style={{ background: "#fdf9f5", border: `1px solid #f0e8dc`, borderRadius: 8, padding: "1.75rem", marginBottom: "1rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.3rem", fontWeight: 700, color: black, margin: "0 0 8px" }}>
            You&apos;ve completed every workout in this program. 🎉
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, margin: "0 0 16px" }}>
            Incredible work. Lisa will update your program with the next phase soon.
          </p>
          <Link href="/my-coaching/messages" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: accent, textDecoration: "none", fontWeight: 600 }}>
            Message Lisa →
          </Link>
        </div>
      )}

      {/* ── Section 3: Message From Lisa ────────────────────────────────── */}
      {clientInfo?.coachMessage && (
        <div style={{ background: white, border: `1px solid ${accent}55`, borderRadius: 8, padding: "1.4rem 1.6rem", marginBottom: "1rem", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${accent}22`, border: `1.5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1rem", fontWeight: 700, color: accent }}>L</span>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, margin: "0 0 1px" }}>From Lisa</p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: muted, margin: 0 }}>
                {clientInfo.coachMessageUpdatedAt
                  ? `Updated ${new Date(clientInfo.coachMessageUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                  : "Personal note for you"}
              </p>
            </div>
          </div>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.05rem", color: black, margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>
            &ldquo;{clientInfo.coachMessage}&rdquo;
          </p>
        </div>
      )}

      {/* ── Section 4: Weekly Snapshot ──────────────────────────────────── */}
      {program && (
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.4rem 1.6rem", marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: muted, margin: "0 0 14px" }}>This Week</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16, marginBottom: recentPRs.length > 0 ? 16 : 0 }}>
            <div>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.6rem", fontWeight: 700, color: thisWeekLogs.length > 0 ? "#5c9e6a" : black, margin: 0, lineHeight: 1 }}>{thisWeekLogs.length}</p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", color: muted, margin: "4px 0 0", letterSpacing: "0.08em" }}>Workouts done</p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.6rem", fontWeight: 700, color: adherence >= 80 ? "#5c9e6a" : adherence >= 50 ? accent : black, margin: 0, lineHeight: 1 }}>{adherence}%</p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", color: muted, margin: "4px 0 0", letterSpacing: "0.08em" }}>Adherence</p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.6rem", fontWeight: 700, color: streak > 0 ? accent : black, margin: 0, lineHeight: 1 }}>
                {streak} {streak > 0 && <span style={{ fontSize: "0.9rem" }}>🔥</span>}
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", color: muted, margin: "4px 0 0", letterSpacing: "0.08em" }}>Week streak</p>
            </div>
            {weightDelta != null && (
              <div>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.6rem", fontWeight: 700, color: weightDelta < 0 ? "#5c9e6a" : weightDelta > 0 ? "#d97460" : black, margin: 0, lineHeight: 1 }}>
                  {weightDelta > 0 ? "↑" : weightDelta < 0 ? "↓" : ""}{Math.abs(weightDelta)}
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", color: muted, margin: "4px 0 0", letterSpacing: "0.08em" }}>{weightUnit} since start</p>
              </div>
            )}
          </div>

          {recentPRs.length > 0 && (
            <div style={{ borderTop: `1px solid ${border}`, paddingTop: 14 }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 10px" }}>Recent PRs 💪</p>
              {recentPRs.map((pr) => (
                <div key={pr.exerciseId} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0" }}>
                  <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black }}>{pr.name}</span>
                  <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 700, color: accent }}>
                    {pr.weight} × {pr.reps} <span style={{ color: "#5c9e6a", fontWeight: 600 }}>+{pr.delta}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Section 5: Quick Actions ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginTop: "0.5rem" }}>
        {[
          { href: "/my-coaching/workouts", label: "View Program", icon: "📋" },
          { href: "/my-coaching/check-in", label: "Submit Check-In", icon: "✍️" },
          { href: "/my-coaching/progress/log", label: "Log Measurements", icon: "📏" },
          { href: "/my-coaching/messages", label: "Message Lisa", icon: "💬" },
        ].map(({ href, label, icon }) => (
          <Link key={href} href={href} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1rem 1.1rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.1rem" }}>{icon}</span>
            <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black }}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
