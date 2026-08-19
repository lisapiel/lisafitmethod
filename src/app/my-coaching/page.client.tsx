"use client"

import { useState, useEffect, useMemo } from "react"
import { fetchUserAttributes } from "aws-amplify/auth"
import Link from "next/link"
import { resolveMacrosFor } from "@/lib/nutrition"
import { toLbs, fromLbs, normalizeUnit, type WeightUnit } from "@/lib/weight"

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
  // Nutrition profile
  heightInches?: number
  age?: number
  sex?: "male" | "female"
  activityLevel?: number
  nutritionGoal?: "fat-loss" | "maintain" | "muscle-gain"
  startingWeight?: number
  customMacros?: { calories?: number; protein?: number; carbs?: number; fat?: number; updatedAt: string }
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
  programId?: string
  setData?: string
  coachFeedback?: string
  coachFeedbackAt?: string
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
  // Set to true if the logger persisted an in-progress draft for today's
  // workout — read from localStorage after nextWorkout resolves. Same key
  // format the workout page writes: `lfm-workout-draft-<weekNumber>-<dayIndex>`.
  const [workoutInProgress, setWorkoutInProgress] = useState(false)

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
              heightInches: c.heightInches,
              age: c.age,
              sex: c.sex,
              activityLevel: c.activityLevel,
              nutritionGoal: c.nutritionGoal,
              startingWeight: c.startingWeight,
              customMacros: c.customMacros,
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
            programId: l.programId as string | undefined,
            setData: l.setData as string | undefined,
            coachFeedback: l.coachFeedback as string | undefined,
            coachFeedbackAt: l.coachFeedbackAt as string | undefined,
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

  // Find next uncompleted day. Memoized so the workout-in-progress effect
  // below has a stable dependency. Only counts workouts logged AGAINST THIS
  // PROGRAM as completed — when a coach assigns a new program that reuses
  // week/day labels, previous completions shouldn't skip today.
  const nextWorkout = useMemo(() => {
    if (!program) return null
    const currentProgramLogs = logs.filter((l) => l.programId === program.id)
    for (const week of program.weeks) {
      for (let di = 0; di < week.days.length; di++) {
        const day = week.days[di]
        const done = currentProgramLogs.some((l) => l.weekNumber === week.weekNumber && l.dayLabel === day.dayLabel)
        if (!done) return { week, day, dayIndex: di }
      }
    }
    return null
  }, [program, logs])

  // Detect an in-progress draft for today's workout so the CTA switches from
  // "Start" to "Continue". No new state system — just reads the same
  // localStorage key the workout logger writes.
  useEffect(() => {
    if (!nextWorkout) { setWorkoutInProgress(false); return }
    try {
      const key = `lfm-workout-draft-${nextWorkout.week.weekNumber}-${nextWorkout.dayIndex}`
      setWorkoutInProgress(typeof window !== "undefined" && localStorage.getItem(key) != null)
    } catch { setWorkoutInProgress(false) }
  }, [nextWorkout])

  if (loading) return <Spinner />

  const firstName = clientInfo?.displayName.split(" ")[0] ?? ""

  // ── Compute Home-surfaced metrics ─────────────────────────────────────────
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const thisWeekLogs = logs.filter((l) => new Date(l.completedAt) >= startOfWeek)

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

  // Weight trend for the compact Progress card. Canonicalize each entry to
  // lb so a mixed lb/kg history doesn't produce a bogus delta; display in
  // the latest submission's unit so the client sees their preferred unit.
  const weighInsRaw = checkIns.filter((c) => c.weight != null).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  const weighInsLbs = weighInsRaw
    .map((c) => ({ lbs: toLbs(c.weight, c.weightUnit), unit: normalizeUnit(c.weightUnit) }))
    .filter((p): p is { lbs: number; unit: WeightUnit } => p.lbs != null)
  const displayUnit: WeightUnit = weighInsLbs[weighInsLbs.length - 1]?.unit
    ?? (clientInfo?.weightUnit === "KG" ? "KG" : "LBS")
  const weightDelta = weighInsLbs.length >= 2
    ? +fromLbs(weighInsLbs[weighInsLbs.length - 1].lbs - weighInsLbs[0].lbs, displayUnit).toFixed(1)
    : null
  const weightUnit = displayUnit === "KG" ? "kg" : "lb"

  const goalPct = primaryGoal ? goalProgressPct(primaryGoal) : null

  // Nutrition state: needs setup (no body data) OR macros resolved
  const nutritionMissing = !!clientInfo && (clientInfo.heightInches == null || clientInfo.age == null || clientInfo.sex == null)
  const macros = clientInfo ? resolveMacrosFor(clientInfo) : null

  // Check-in status — derived from the same `checkIns` list the rest of the
  // page already uses. A check-in is "due" if there has been no submission in
  // the last 7 days (or ever). Immediately after a submission we surface a
  // small confirmation instead of a large CTA so it doesn't look stale.
  const checkInStatus = (() => {
    if (checkIns.length === 0) return { state: "due" as const, daysAgo: null }
    const latest = [...checkIns].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
    const daysAgo = Math.floor((Date.now() - new Date(latest.submittedAt).getTime()) / 86_400_000)
    if (daysAgo >= 7) return { state: "due" as const, daysAgo }
    return { state: "done" as const, daysAgo }
  })()

  // Latest logged workout with unread coach feedback
  const latestFeedback = (() => {
    const withFb = logs.filter((l) => l.coachFeedback && l.coachFeedbackAt)
    if (withFb.length === 0) return null
    const newest = withFb.sort((a, b) => (b.coachFeedbackAt ?? "").localeCompare(a.coachFeedbackAt ?? ""))[0]
    let seenAt = ""
    try { seenAt = typeof window !== "undefined" ? (localStorage.getItem("lfm-coach-feedback-seen-at") ?? "") : "" } catch { /* ignore */ }
    if (seenAt && (newest.coachFeedbackAt ?? "") <= seenAt) return null
    // Compute the dayIndex for the log's day so we can link to it
    let dayIndex = -1
    if (program) {
      const w = program.weeks.find((x) => x.weekNumber === newest.weekNumber)
      if (w) dayIndex = w.days.findIndex((d) => d.dayLabel === newest.dayLabel)
    }
    return { log: newest, dayIndex }
  })()

  // ── Home layout ─────────────────────────────────────────────────────────
  // Order (deterministic, no scoring engine):
  //   1. Greeting
  //   2. New feedback nudge (only if Lisa just left a note — highest signal)
  //   3. Today's Workout (primary — dark card, Start / Continue / Complete / Rest)
  //   4. Weekly Check-In (moves above Nutrition when due; small confirmation otherwise)
  //   5. Nutrition (setup nudge OR compact macro strip)
  //   6. Progress + Goal (compact merged section)
  //   7. Message from Lisa (persistent coach note — kept when present)
  //   8. Message Lisa (fast path to Messages)
  return (
    <div>
      {/* ── 1. Greeting ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, marginBottom: "0.4rem" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long" })}, {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.6rem, 5.5vw, 2rem)", fontWeight: 700, color: black, margin: "0 0 0.35rem", lineHeight: 1.15 }}>
          {firstName ? `Welcome back, ${firstName}.` : "Your Coaching Portal"}
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, margin: 0 }}>
          Here&apos;s what we&apos;re working on today.
        </p>
      </div>

      {/* ── New feedback nudge — high-signal, top of feed when present ── */}
      {latestFeedback && latestFeedback.dayIndex >= 0 && (
        <Link
          href={`/my-coaching/workouts/${latestFeedback.log.weekNumber}/${latestFeedback.dayIndex}`}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: `${accent}18`, border: `1px solid ${accent}`,
            padding: "10px 14px", borderRadius: 8, marginBottom: "1rem",
            textDecoration: "none",
          }}
        >
          <span style={{ display: "inline-block", width: 8, height: 8, background: accent, borderRadius: "50%" }} />
          <span style={{ flex: 1, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: black, fontWeight: 600 }}>
            New note from Lisa on your last workout →
          </span>
        </Link>
      )}

      {/* ── 2. Today's Workout (Primary) ─────────────────────────────────
          Four states:
          - No program yet: "Lisa is building your program" (unchanged copy)
          - Workout available + draft in localStorage: Continue Workout
          - Workout available + no draft: Start Workout
          - Program complete: rest / phase-complete card
          Uses existing nextWorkout logic and existing workout routes. */}
      {!program ? (
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "clamp(1.5rem, 5vw, 2.5rem)", textAlign: "center", marginBottom: "1rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fdf6ec", border: `2px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" /></svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.15rem, 4vw, 1.4rem)", fontWeight: 700, color: black, margin: "0 0 0.75rem" }}>
            Your program is being prepared
          </h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, maxWidth: 380, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
            You&apos;ll get an email when your personalised program is ready. In the meantime, send Lisa a message with anything you want her to know.
          </p>
          <Link href="/my-coaching/messages" style={{ display: "inline-block", background: accent, color: black, padding: "12px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textDecoration: "none", borderRadius: 4 }}>
            Message Lisa
          </Link>
        </div>
      ) : nextWorkout ? (
        <div style={{ background: black, color: white, borderRadius: 8, padding: "clamp(1.4rem, 4vw, 1.75rem)", marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 8px" }}>
            {workoutInProgress ? "In progress" : "Today’s Workout"}
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.35rem, 4.8vw, 1.6rem)", fontWeight: 700, color: white, margin: "0 0 8px", lineHeight: 1.2 }}>
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
            {workoutInProgress ? "Continue Workout →" : "Start Workout →"}
          </Link>
        </div>
      ) : (
        <div style={{ background: "#fdf9f5", border: `1px solid #f0e8dc`, borderRadius: 8, padding: "clamp(1.4rem, 4vw, 1.75rem)", marginBottom: "1rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#5c9e6a", margin: "0 0 8px" }}>
            Program complete
          </p>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.15rem, 4vw, 1.3rem)", fontWeight: 700, color: black, margin: "0 0 8px" }}>
            Workout complete ✓
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, margin: "0 0 16px" }}>
            You&apos;ve completed every workout in this program. Lisa will update your program with the next phase soon.
          </p>
          <Link href="/my-coaching/messages" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: accent, textDecoration: "none", fontWeight: 600 }}>
            Message Lisa →
          </Link>
        </div>
      )}

      {/* ── 3. Weekly Check-In ─────────────────────────────────────────
          Prominent CTA when due; compact confirmation with history link
          otherwise. Uses existing checkInStatus derivation from Task 2. */}
      {checkInStatus.state === "due" ? (
        <Link
          href="/my-coaching/check-in"
          style={{
            display: "flex", alignItems: "center", gap: 12,
            background: white, border: `1px solid ${accent}`, borderLeft: `4px solid ${accent}`,
            padding: "14px 16px", borderRadius: 8, marginBottom: "1rem",
            textDecoration: "none",
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, marginBottom: 3 }}>
              Weekly check-in
            </span>
            <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", color: black, fontWeight: 600 }}>
              Your check-in is ready
            </span>
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: accent, fontWeight: 600, whiteSpace: "nowrap" }}>
            Complete check-in →
          </span>
        </Link>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap",
          padding: "8px 12px", marginBottom: "1rem",
          fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden style={{ color: "#5c9e6a", fontWeight: 700 }}>✓</span>
            Check-in complete
            {checkInStatus.daysAgo != null && checkInStatus.daysAgo > 0 && (
              <span style={{ color: "#8a847e" }}>· {checkInStatus.daysAgo}d ago</span>
            )}
          </span>
          <Link href="/my-coaching/check-in/history" style={{ color: accent, textDecoration: "none", fontWeight: 600 }}>
            View history →
          </Link>
        </div>
      )}

      {/* ── 4. Nutrition ──────────────────────────────────────────────
          Displays the CURRENT stored macro state only. The underlying
          calorie/macro calculation is intentionally not audited here (Task 4).
          - Not configured: "Set up your nutrition targets"
          - Configured: compact strip showing kcal + P/C/F */}
      {nutritionMissing ? (
        <Link
          href="/my-coaching/setup"
          style={{
            display: "flex", alignItems: "center", gap: 12,
            background: white, border: `1px solid ${accent}`, borderLeft: `4px solid ${accent}`,
            padding: "12px 14px", borderRadius: 8, marginBottom: "1rem",
            textDecoration: "none",
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, marginBottom: 3 }}>
              Nutrition
            </span>
            <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", color: black, fontWeight: 600 }}>
              Set up your nutrition targets
            </span>
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: accent, fontWeight: 600, whiteSpace: "nowrap" }}>
            Set Up Nutrition →
          </span>
        </Link>
      ) : macros ? (
        <Link
          href="/my-coaching/nutrition"
          style={{
            display: "block",
            background: white, border: `1px solid ${border}`,
            padding: "14px 16px", borderRadius: 8, marginBottom: "1rem",
            textDecoration: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, margin: 0 }}>
              Nutrition
            </p>
            <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: accent, fontWeight: 600 }}>
              View Nutrition →
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem 1rem" }}>
            <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: black, lineHeight: 1 }}>
              {macros.calories.toLocaleString()}
              <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 600, color: muted, marginLeft: 4, letterSpacing: "0.06em" }}>KCAL</span>
            </span>
            <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, fontWeight: 500 }}>
              {macros.protein}P · {macros.carbs}C · {macros.fat}F
            </span>
          </div>
        </Link>
      ) : null}

      {/* ── 5. Progress + Goal (compact) ──────────────────────────────
          Uses existing computed metrics (thisWeekLogs, streak) plus the
          existing primaryGoal record. Deliberately restrained — Progress
          tab owns the full view. */}
      {(program || primaryGoal || clientInfo?.goal) && (
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1rem 1.15rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: (program || primaryGoal) ? 12 : 0 }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, margin: 0 }}>
              Progress
            </p>
            <Link href="/my-coaching/progress" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: accent, fontWeight: 600, textDecoration: "none" }}>
              View Progress →
            </Link>
          </div>
          {program && (
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: (primaryGoal || clientInfo?.goal) ? 12 : 0 }}>
              <div>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: thisWeekLogs.length > 0 ? "#5c9e6a" : black, margin: 0, lineHeight: 1 }}>
                  {thisWeekLogs.length}
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: muted, margin: "3px 0 0", letterSpacing: "0.08em" }}>
                  Workouts this week
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: streak > 0 ? accent : black, margin: 0, lineHeight: 1 }}>
                  {streak}{streak > 0 && <span style={{ fontSize: "0.75rem", marginLeft: 4 }}>🔥</span>}
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: muted, margin: "3px 0 0", letterSpacing: "0.08em" }}>
                  Week streak
                </p>
              </div>
              {weightDelta != null && (
                <div>
                  <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: weightDelta < 0 ? "#5c9e6a" : weightDelta > 0 ? "#d97460" : black, margin: 0, lineHeight: 1 }}>
                    {weightDelta > 0 ? "↑" : weightDelta < 0 ? "↓" : ""}{Math.abs(weightDelta)}
                    <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 600, color: muted, marginLeft: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {weightUnit}
                    </span>
                  </p>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: muted, margin: "3px 0 0", letterSpacing: "0.08em" }}>
                    Since start
                  </p>
                </div>
              )}
            </div>
          )}
          {primaryGoal ? (
            <div style={{ borderTop: program ? `1px solid ${border}` : "none", paddingTop: program ? 12 : 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>
                  Current goal
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", fontWeight: 600, color: black, margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {primaryGoal.label || primaryGoal.type}
                  {primaryGoal.currentValue != null && primaryGoal.targetValue != null && (
                    <span style={{ color: muted, fontWeight: 500 }}>
                      {" · "}{fmtVal(primaryGoal.currentValue, primaryGoal.unit)} / {fmtVal(primaryGoal.targetValue, primaryGoal.unit)}
                    </span>
                  )}
                </p>
              </div>
              {goalPct !== null && (
                <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1rem", fontWeight: 700, color: goalPct >= 100 ? "#5c9e6a" : accent, whiteSpace: "nowrap" }}>
                  {goalPct}%
                </span>
              )}
            </div>
          ) : clientInfo?.goal ? (
            <div style={{ borderTop: program ? `1px solid ${border}` : "none", paddingTop: program ? 12 : 0 }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>
                Working toward
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", fontWeight: 600, color: black, margin: 0 }}>
                {clientInfo.goal}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* ── 6. Message from Lisa (persistent coach note) ─────────────── */}
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

      {/* ── 7. Message Lisa (fast path to Messages tab) ──────────────── */}
      <Link
        href="/my-coaching/messages"
        style={{
          display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between",
          background: white, border: `1px solid ${border}`, borderRadius: 8,
          padding: "14px 16px", marginBottom: "1rem",
          textDecoration: "none",
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, marginBottom: 3 }}>
            Message Lisa
          </span>
          <span style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: muted, lineHeight: 1.45 }}>
            Questions about your program, technique, schedule or progress?
          </span>
        </span>
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: accent, fontWeight: 600, whiteSpace: "nowrap" }}>
          Open Messages →
        </span>
      </Link>
    </div>
  )
}
