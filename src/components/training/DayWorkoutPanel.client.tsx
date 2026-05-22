"use client"

import { useState, useEffect } from "react"
import { useCourseProgress } from "./CourseProgressContext"
import { WORKOUT_DAYS, ExerciseDef } from "@/lib/workoutData"
import { ExerciseLog, SetLog } from "@/lib/courseProgress"

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#888"
const cardBg = "#161616"
const border = "#2a2a2a"
const inputBg = "#1e1e1e"

type DayKey = "a" | "b" | "c"

function defaultSets(ex: ExerciseDef, unit: "lbs" | "kg"): SetLog[] {
  return Array.from({ length: ex.defaultSets }, () => ({
    reps: ex.defaultReps ?? 0,
    weight: 0,
    unit,
  }))
}

function buildInitialLogs(
  exercises: ExerciseDef[],
  unit: "lbs" | "kg"
): Record<string, SetLog[]> {
  const logs: Record<string, SetLog[]> = {}
  for (const ex of exercises) {
    logs[ex.id] = defaultSets(ex, unit)
  }
  return logs
}

interface SetRowProps {
  set: SetLog
  index: number
  bodyweight: boolean
  distanceBased: boolean
  onChange: (s: SetLog) => void
  onRemove: () => void
  canRemove: boolean
}

function SetRow({ set, index, bodyweight, distanceBased, onChange, onRemove, canRemove }: SetRowProps) {
  const inp: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${border}`,
    borderRadius: 4,
    color: cream,
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: "0.7rem",
    padding: "6px 8px",
    width: 56,
    textAlign: "center",
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.6rem", color: muted, width: 36, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em" }}>
        Set {index + 1}
      </span>

      {distanceBased ? (
        <span style={{ fontSize: "0.65rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>distance / time</span>
      ) : (
        <>
          <input
            type="number"
            min={0}
            value={set.reps || ""}
            placeholder="reps"
            onChange={(e) => onChange({ ...set, reps: Number(e.target.value) })}
            style={inp}
          />
          <span style={{ fontSize: "0.6rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>reps</span>
        </>
      )}

      {!bodyweight && (
        <>
          <input
            type="number"
            min={0}
            step={0.5}
            value={set.weight || ""}
            placeholder="wt"
            onChange={(e) => onChange({ ...set, weight: Number(e.target.value) })}
            style={inp}
          />
          <span style={{ fontSize: "0.6rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>{set.unit}</span>
        </>
      )}

      {bodyweight && (
        <span style={{ fontSize: "0.6rem", background: "#2a2a2a", color: muted, padding: "3px 8px", borderRadius: 3, fontFamily: "var(--font-montserrat), sans-serif" }}>BW</span>
      )}

      {canRemove && (
        <button
          onClick={onRemove}
          style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.7rem", padding: "0 4px", lineHeight: 1 }}
          title="Remove set"
        >
          ✕
        </button>
      )}
    </div>
  )
}

interface ExerciseBlockProps {
  ex: ExerciseDef
  sets: SetLog[]
  unit: "lbs" | "kg"
  onChange: (sets: SetLog[]) => void
}

function ExerciseBlock({ ex, sets, unit, onChange }: ExerciseBlockProps) {
  const distanceBased = ex.defaultReps === null

  function updateSet(i: number, s: SetLog) {
    const next = [...sets]
    next[i] = s
    onChange(next)
  }

  function addSet() {
    const last = sets[sets.length - 1] ?? { reps: ex.defaultReps ?? 0, weight: 0, unit }
    onChange([...sets, { ...last }])
  }

  function removeSet(i: number) {
    onChange(sets.filter((_, idx) => idx !== i))
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", fontWeight: 600, color: cream, letterSpacing: "0.05em" }}>
          {ex.name}
        </span>
        <span style={{ fontSize: "0.6rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>
          {ex.defaultSets}×{ex.defaultReps ?? "—"}{ex.note ? ` · ${ex.note}` : ""}
        </span>
      </div>

      {sets.map((set, i) => (
        <SetRow
          key={i}
          set={set}
          index={i}
          bodyweight={ex.bodyweight}
          distanceBased={distanceBased}
          onChange={(s) => updateSet(i, s)}
          onRemove={() => removeSet(i)}
          canRemove={sets.length > 1}
        />
      ))}

      <button
        onClick={addSet}
        style={{
          background: "none",
          border: `1px dashed ${border}`,
          color: muted,
          fontSize: "0.6rem",
          fontFamily: "var(--font-montserrat), sans-serif",
          letterSpacing: "0.08em",
          cursor: "pointer",
          padding: "4px 10px",
          marginTop: 2,
        }}
      >
        + add set
      </button>
    </div>
  )
}

interface CompletedSummaryProps {
  exercises: ExerciseLog[]
  day: DayKey
  onEdit: () => void
}

function CompletedSummary({ exercises, day, onEdit }: CompletedSummaryProps) {
  const defs = WORKOUT_DAYS[day].exercises
  return (
    <div>
      {exercises.map((ex) => {
        const def = defs.find((d) => d.id === ex.exerciseId)
        if (!def) return null
        const weightedSets = ex.sets.filter((s) => s.weight > 0)
        const maxWeight = weightedSets.length > 0 ? Math.max(...weightedSets.map((s) => s.weight)) : null
        return (
          <div key={ex.exerciseId} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${border}` }}>
            <span style={{ fontSize: "0.65rem", color: "#aaa", fontFamily: "var(--font-montserrat), sans-serif" }}>{def.name}</span>
            <span style={{ fontSize: "0.65rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif" }}>
              {ex.sets.length} sets
              {maxWeight ? ` · ${maxWeight} ${ex.sets[0]?.unit ?? "lbs"}` : def.bodyweight ? " · BW" : ""}
            </span>
          </div>
        )
      })}
      <button
        onClick={onEdit}
        style={{
          marginTop: 16,
          background: "none",
          border: `1px solid ${border}`,
          color: muted,
          fontSize: "0.6rem",
          fontFamily: "var(--font-montserrat), sans-serif",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
          padding: "8px 16px",
        }}
      >
        Edit log
      </button>
    </div>
  )
}

export default function DayWorkoutPanel({ day }: { day: DayKey }) {
  const { ready, progress, currentPosition, logSession, getSessionFor } = useCourseProgress()
  const exercises = WORKOUT_DAYS[day].exercises

  // Which week is selected in the UI
  const [selectedRound, setSelectedRound] = useState(1)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [editing, setEditing] = useState(false)
  const [logs, setLogs] = useState<Record<string, SetLog[]>>(() =>
    buildInitialLogs(exercises, "lbs")
  )

  // Once context is ready, auto-select the next incomplete week for this day
  useEffect(() => {
    if (!ready) return
    const pos = currentPosition
    // Find the next week for THIS day that hasn't been logged
    for (let round = pos.round; round <= pos.round + 1; round++) {
      for (let week = 1; week <= 4; week++) {
        if (!getSessionFor(round, week, day)) {
          setSelectedRound(round)
          setSelectedWeek(week)
          return
        }
      }
    }
    // All done — show current round/week
    setSelectedRound(pos.round)
    setSelectedWeek(pos.week)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // When selected week changes, pre-fill from existing log if available
  useEffect(() => {
    const existing = getSessionFor(selectedRound, selectedWeek, day)
    if (existing) {
      const filled: Record<string, SetLog[]> = {}
      for (const ex of exercises) {
        const found = existing.exercises.find((e) => e.exerciseId === ex.id)
        filled[ex.id] = found ? found.sets : defaultSets(ex, progress.weightUnit)
      }
      setLogs(filled)
    } else {
      setLogs(buildInitialLogs(exercises, progress.weightUnit))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound, selectedWeek, day])

  const existingSession = getSessionFor(selectedRound, selectedWeek, day)
  const isCompleted = !!existingSession && !editing

  function handleComplete() {
    const exerciseLogs: ExerciseLog[] = exercises.map((ex) => ({
      exerciseId: ex.id,
      sets: logs[ex.id] ?? defaultSets(ex, progress.weightUnit),
    }))
    logSession(selectedRound, selectedWeek, day, exerciseLogs)
    setEditing(false)
  }

  if (!ready) return null

  // Week selector: rounds 1..currentPosition.round+1, weeks 1..4
  const maxRound = Math.max(currentPosition.round, selectedRound)
  const weekOptions: { round: number; week: number; label: string }[] = []
  for (let r = 1; r <= maxRound + 1; r++) {
    for (let w = 1; w <= 4; w++) {
      const label = r === 1 ? `Week ${w}` : `R${r} Wk${w}`
      weekOptions.push({ round: r, week: w, label })
    }
  }

  return (
    <div
      style={{
        margin: "48px 0 64px",
        border: isCompleted ? `1px solid ${gold}` : `1px solid ${border}`,
        background: cardBg,
        padding: "28px 28px 32px",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isCompleted && (
            <span style={{ color: gold, fontSize: "1rem", lineHeight: 1 }}>✓</span>
          )}
          <span style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: isCompleted ? gold : cream,
          }}>
            {isCompleted ? "Session Logged" : "Log This Session"}
          </span>
        </div>

        {/* Week selector */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {weekOptions.slice(0, Math.min(weekOptions.length, 8)).map((opt) => {
            const active = opt.round === selectedRound && opt.week === selectedWeek
            const done = !!getSessionFor(opt.round, opt.week, day)
            return (
              <button
                key={`${opt.round}-${opt.week}`}
                onClick={() => { setSelectedRound(opt.round); setSelectedWeek(opt.week); setEditing(false) }}
                style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.55rem",
                  letterSpacing: "0.08em",
                  padding: "5px 9px",
                  border: active ? `1px solid ${gold}` : `1px solid ${border}`,
                  background: active ? "rgba(201,169,110,0.12)" : "transparent",
                  color: active ? gold : done ? "#aaa" : muted,
                  cursor: "pointer",
                  position: "relative",
                }}
                title={opt.label}
              >
                {opt.label}
                {done && <span style={{ position: "absolute", top: 1, right: 2, fontSize: "0.4rem", color: gold }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      {isCompleted ? (
        <CompletedSummary
          exercises={existingSession.exercises}
          day={day}
          onEdit={() => setEditing(true)}
        />
      ) : (
        <>
          {exercises.map((ex) => (
            <ExerciseBlock
              key={ex.id}
              ex={ex}
              sets={logs[ex.id] ?? defaultSets(ex, progress.weightUnit)}
              unit={progress.weightUnit}
              onChange={(sets) => setLogs((prev) => ({ ...prev, [ex.id]: sets }))}
            />
          ))}

          <div style={{ marginTop: 8, borderTop: `1px solid ${border}`, paddingTop: 20 }}>
            <button
              onClick={handleComplete}
              style={{
                background: gold,
                color: "#0a0a0a",
                border: "none",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "14px 32px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Mark Session Complete
            </button>
            <p style={{ marginTop: 10, fontSize: "0.6rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", textAlign: "center" }}>
              You can leave weight fields empty for bodyweight exercises.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// Tiny badge shown at the top of each day section
export function DayStatusBadge({ day }: { day: DayKey }) {
  const { ready, currentPosition, getSessionFor } = useCourseProgress()
  if (!ready) return null

  const session = getSessionFor(currentPosition.round, currentPosition.week, day)
  if (!session) return null

  const date = new Date(session.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 16,
      padding: "5px 12px",
      border: `1px solid ${gold}`,
      background: "rgba(201,169,110,0.08)",
    }}>
      <span style={{ color: gold, fontSize: "0.7rem" }}>✓</span>
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold, letterSpacing: "0.1em" }}>
        Week {currentPosition.week} logged · {date}
      </span>
    </div>
  )
}
