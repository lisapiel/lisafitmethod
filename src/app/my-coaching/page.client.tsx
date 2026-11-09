"use client"

import { useState, useEffect, useMemo } from "react"
import { fetchUserAttributes } from "aws-amplify/auth"
import { workoutDraftKey, legacyWorkoutDraftKey } from "@/lib/workoutDraftKey"
import Link from "next/link"
import { resolveMacrosFor } from "@/lib/nutrition"
import { toLbs, fromLbs, normalizeUnit, type WeightUnit } from "@/lib/weight"
import { expandedWeeks } from "@/lib/programExpansion"
import { checkInStatus as checkInState, type PortalWeek } from "@/lib/portalProgram"
import UpNextCard from "@/components/portal/UpNextCard"
import CoachNote from "@/components/portal/CoachNote"
import HomeGlance from "@/components/portal/HomeGlance"
import { ChevronRight } from "@/components/portal/PortalIcons"


type ProgramDay = { dayLabel: string; notes: string; exercises: { exerciseId: string; name: string; sets: string; reps: string; weight: string }[]; dayType?: "sport" }
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

function HomeSkeleton() {
  return (
    <div className="pt pt-home" role="status" aria-label="Loading your plan">
      <div className="pt-hello"><span className="pt-skel" style={{ display: "block", width: 160, height: 34 }} /></div>
      <span className="pt-skel" style={{ display: "block", height: 230, borderRadius: 16 }} />
      <div className="pt-glance">{[0, 1, 2].map((i) => <span key={i} className="pt-skel" style={{ display: "block", height: 92 }} />)}</div>
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

export default function MyCoachingHomeClient() {
  const [loading, setLoading] = useState(true)
  const [, setEmail] = useState("")
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [program, setProgram] = useState<ProgramInfo | null>(null)
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [primaryGoal, setPrimaryGoal] = useState<Goal | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  // Set to true if the logger persisted an in-progress draft for today's
  // workout — read from localStorage after nextWorkout resolves, using the
  // same keys the workout page writes (see workoutDraftKey).
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
            // Expand rotation-style programs so `nextWorkout` iterates every
            // week the client is scheduled to see, not just the stored
            // template week(s). Pass-through for traditional multi-week
            // programs.
            const weeks = expandedWeeks({
              weeks: prog.weeks,
              durationWeeks: typeof prog.durationWeeks === "number" ? prog.durationWeeks : undefined,
            }) as ProgramWeek[]
            if (weeks.length > 0) {
              setProgram({ id: prog.id, name: prog.name, weeks })
            }
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
    if (!nextWorkout || !program) { setWorkoutInProgress(false); return }
    try {
      const keys = [
        workoutDraftKey(program.id, nextWorkout.week.weekNumber, nextWorkout.dayIndex),
        legacyWorkoutDraftKey(nextWorkout.week.weekNumber, nextWorkout.dayIndex),
      ]
      setWorkoutInProgress(typeof window !== "undefined" && keys.some((k) => localStorage.getItem(k) != null))
    } catch { setWorkoutInProgress(false) }
  }, [nextWorkout, program])

  if (loading) return <HomeSkeleton />

  const firstName = clientInfo?.displayName.split(" ")[0] ?? ""
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })


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

  // Weight change in the client's own unit, from check-ins (canonicalised to lb first).
  const weighInsLbs = checkIns.filter((c) => c.weight != null).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .map((c) => ({ lbs: toLbs(c.weight, c.weightUnit), unit: normalizeUnit(c.weightUnit) }))
    .filter((p): p is { lbs: number; unit: WeightUnit } => p.lbs != null)
  const displayUnit: WeightUnit = weighInsLbs[weighInsLbs.length - 1]?.unit ?? (clientInfo?.weightUnit === "KG" ? "KG" : "LBS")
  const weightDelta = weighInsLbs.length >= 2 ? +fromLbs(weighInsLbs[weighInsLbs.length - 1].lbs - weighInsLbs[0].lbs, displayUnit).toFixed(1) : null
  const weightUnit = displayUnit === "KG" ? "kg" : "lb"
  const goalPct = primaryGoal ? goalProgressPct(primaryGoal) : null

  const nutritionMissing = !!clientInfo && (clientInfo.heightInches == null || clientInfo.age == null || clientInfo.sex == null)
  const macros = clientInfo ? resolveMacrosFor(clientInfo) : null
  const checkIn = checkInState(checkIns.map((c) => c.submittedAt))
  const weekStrip = (() => {
    if (!program) return null
    const wk = nextWorkout?.week ?? program.weeks[program.weeks.length - 1]
    if (!wk) return null
    const done = logs.filter((l) => l.programId === program.id && l.weekNumber === wk.weekNumber)
    const finished = wk.days.filter((d) => done.some((l) => l.dayLabel === d.dayLabel)).length
    const sportDays = wk.days.map((d, i) => ((d as { dayType?: string }).dayType === "sport" ? i : -1)).filter((i) => i >= 0)
    return { label: wk.label, finished, total: wk.days.length, sportDays }
  })()

  const latestFeedback = (() => {
    const withFb = logs.filter((l) => l.coachFeedback && l.coachFeedbackAt)
    if (withFb.length === 0) return null
    const newest = withFb.sort((a, b) => (b.coachFeedbackAt ?? "").localeCompare(a.coachFeedbackAt ?? ""))[0]
    let seenAt = ""
    try { seenAt = typeof window !== "undefined" ? (localStorage.getItem("lfm-coach-feedback-seen-at") ?? "") : "" } catch { /* ignore */ }
    if (seenAt && (newest.coachFeedbackAt ?? "") <= seenAt) return null
    let dayIndex = -1
    if (program) {
      const w = program.weeks.find((x) => x.weekNumber === newest.weekNumber)
      if (w) dayIndex = w.days.findIndex((d) => d.dayLabel === newest.dayLabel)
    }
    return { log: newest, dayIndex }
  })()

  const progressBits = [
    weightDelta != null && weightDelta !== 0 ? `${weightDelta < 0 ? "Down" : "Up"} ${Math.abs(weightDelta)} ${weightUnit} since you started` : null,
    primaryGoal && goalPct !== null ? `${goalPct}% of the way to ${primaryGoal.label || "your goal"}` : null,
    streak > 1 ? `${streak} weeks in a row` : null,
  ].filter(Boolean) as string[]
  if (progressBits.length === 0 && program) progressBits.push("Measurements, photos and your goals")

  return (
    <div className="pt pt-home">
      <header className="pt-hello">
        <h1>{firstName ? `Hi ${firstName}` : "Your coaching"}</h1>
        <p className="pt-date">{today}</p>
      </header>

      <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
        {latestFeedback && latestFeedback.dayIndex >= 0 && (
          <Link className="pt-row" href={`/my-coaching/workouts/${latestFeedback.log.weekNumber}/${latestFeedback.dayIndex}`}>
            <span className="pt-dot" aria-hidden="true" />
            <span className="pt-row-main">
              <span className="pt-row-title">I left you a note</span>
              <span className="pt-row-sub pt-trunc">On your {latestFeedback.log.dayLabel} workout</span>
            </span>
            <span className="pt-chev"><ChevronRight /></span>
          </Link>
        )}

        {!program ? (
          <section className="pt-empty">
            <h2>Your program is on its way</h2>
            <p>I&apos;m building it around your goals and schedule. You&apos;ll get an email as soon as it&apos;s ready. Anything you want me to know in the meantime?</p>
            <Link className="pt-btn" href="/my-coaching/messages">Message me</Link>
          </section>
        ) : nextWorkout ? (
          <UpNextCard week={nextWorkout.week as PortalWeek} day={nextWorkout.day} dayIndex={nextWorkout.dayIndex} inProgress={workoutInProgress} />
        ) : (
          <section className="pt-empty">
            <h2>You finished the program</h2>
            <p>Every workout is done. I&apos;m putting your next phase together and I&apos;ll let you know when it&apos;s ready.</p>
            <Link className="pt-btn" href="/my-coaching/messages">Message me</Link>
          </section>
        )}
      </div>

      <div className="pt-home-side">
        <HomeGlance
          week={weekStrip}
          checkIn={checkIn}
          target={macros ? { calories: macros.calories, protein: macros.protein } : null}
          setupNeeded={nutritionMissing}
        />

        {progressBits.length > 0 && (
          <Link className="pt-row" href="/my-coaching/progress">
            <span className="pt-row-main">
              <span className="pt-row-title">Your progress</span>
              <span className="pt-row-sub">{progressBits.join(" · ")}</span>
            </span>
            <span className="pt-chev"><ChevronRight /></span>
          </Link>
        )}

        {clientInfo?.coachMessage && <CoachNote text={clientInfo.coachMessage} updatedAt={clientInfo.coachMessageUpdatedAt} />}
      </div>
    </div>
  )
}
