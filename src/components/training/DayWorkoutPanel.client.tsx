"use client"

import { useCourseProgress } from "./CourseProgressContext"
import { useDayLogs, defaultSets } from "./DayLogsContext"
import { WORKOUT_DAYS, ExerciseDef } from "@/lib/workoutData"
import { ExerciseLog, SetLog } from "@/lib/courseProgress"

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#888"
const cardBg = "#161616"
const border = "#2a2a2a"
const inputBg = "#1e1e1e"

type DayKey = "a" | "b" | "c"

const WEIGHT_STEP = 2.5

interface SetRowProps {
  set: SetLog
  index: number
  bodyweightOnly: boolean
  distanceOrTime: boolean
  onChange: (s: SetLog) => void
  onRemove: () => void
  canRemove: boolean
}

function SetRow({ set, index, bodyweightOnly, distanceOrTime, onChange, onRemove, canRemove }: SetRowProps) {
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

  const stepBtn: React.CSSProperties = {
    background: "#252525",
    border: "none",
    color: muted,
    cursor: "pointer",
    fontSize: "0.75rem",
    width: 28,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
    flexShrink: 0,
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
      <span
        style={{
          fontSize: "0.6rem",
          color: muted,
          width: 36,
          fontFamily: "var(--font-montserrat), sans-serif",
          letterSpacing: "0.05em",
        }}
      >
        Set {index + 1}
      </span>

      {distanceOrTime ? (
        <>
          <input
            type="text"
            value={set.distanceTime ?? ""}
            placeholder="e.g. 30m"
            onChange={(e) => onChange({ ...set, distanceTime: e.target.value })}
            style={{ ...inp, width: 68 }}
          />
          <span style={{ fontSize: "0.6rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>
            dist/time
          </span>
        </>
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
          <span style={{ fontSize: "0.6rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>
            reps
          </span>
        </>
      )}

      {bodyweightOnly ? (
        <span
          style={{
            fontSize: "0.6rem",
            background: "#2a2a2a",
            color: muted,
            padding: "3px 8px",
            borderRadius: 3,
            fontFamily: "var(--font-montserrat), sans-serif",
          }}
        >
          BW
        </span>
      ) : (
        <>
          <button
            onClick={() => onChange({ ...set, weight: Math.max(0, (set.weight ?? 0) - WEIGHT_STEP) })}
            style={stepBtn}
          >
            −
          </button>
          <input
            type="number"
            min={0}
            step={WEIGHT_STEP}
            value={set.weight || ""}
            placeholder="wt"
            onChange={(e) => onChange({ ...set, weight: Number(e.target.value) })}
            style={inp}
          />
          <button
            onClick={() => onChange({ ...set, weight: (set.weight ?? 0) + WEIGHT_STEP })}
            style={stepBtn}
          >
            +
          </button>
          <span style={{ fontSize: "0.6rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>
            {set.unit}
          </span>
        </>
      )}

      {canRemove && (
        <button
          onClick={onRemove}
          style={{
            background: "none",
            border: "none",
            color: "#555",
            cursor: "pointer",
            fontSize: "0.7rem",
            padding: "0 4px",
            lineHeight: 1,
          }}
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
  const bodyweightOnly = ex.bodyweight && !ex.optionalWeight
  const distanceOrTime = !!ex.trackDistanceOrTime

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
        <span
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.7rem",
            fontWeight: 600,
            color: cream,
            letterSpacing: "0.05em",
          }}
        >
          {ex.name}
        </span>
        <span
          style={{
            fontSize: "0.6rem",
            color: muted,
            fontFamily: "var(--font-montserrat), sans-serif",
          }}
        >
          {ex.defaultSets}×{ex.defaultReps ?? "—"}
          {ex.note ? ` · ${ex.note}` : ""}
        </span>
      </div>

      {sets.map((set, i) => (
        <SetRow
          key={i}
          set={set}
          index={i}
          bodyweightOnly={bodyweightOnly}
          distanceOrTime={distanceOrTime}
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
        const distTime = ex.sets.map((s) => s.distanceTime).find(Boolean)
        return (
          <div
            key={ex.exerciseId}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
              borderBottom: `1px solid ${border}`,
            }}
          >
            <span
              style={{ fontSize: "0.65rem", color: "#aaa", fontFamily: "var(--font-montserrat), sans-serif" }}
            >
              {def.name}
            </span>
            <span
              style={{ fontSize: "0.65rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif" }}
            >
              {ex.sets.length} sets
              {maxWeight
                ? ` · ${maxWeight} ${ex.sets[0]?.unit ?? "lbs"}`
                : def.bodyweight && !def.optionalWeight
                ? " · BW"
                : ""}
              {distTime ? ` · ${distTime}` : ""}
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
  const { ready } = useCourseProgress()
  const {
    logs, updateExerciseSets, handleComplete, existingSession, isCompleted,
    setSelectedRound, setSelectedWeek, setEditing,
    weekOptions, addWeek, weightUnit,
  } = useDayLogs()

  if (!ready) return null

  const exercises = WORKOUT_DAYS[day].exercises

  return (
    <div
      style={{
        margin: "48px 0 0",
        border: isCompleted ? `1px solid ${gold}` : `1px solid ${border}`,
        background: cardBg,
        padding: "28px 28px 32px",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isCompleted && <span style={{ color: gold, fontSize: "1rem", lineHeight: 1 }}>✓</span>}
          <span
            style={{
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: isCompleted ? gold : cream,
            }}
          >
            {isCompleted ? "Session Logged" : "Log This Session"}
          </span>
        </div>

        {/* Week selector + add-week button */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          {weekOptions.map((opt) => {
            return (
              <button
                key={`${opt.round}-${opt.week}`}
                onClick={() => {
                  setSelectedRound(opt.round)
                  setSelectedWeek(opt.week)
                  setEditing(false)
                }}
                style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.55rem",
                  letterSpacing: "0.08em",
                  padding: "5px 9px",
                  border: opt.active ? `1px solid ${gold}` : `1px solid ${border}`,
                  background: opt.active ? "rgba(201,169,110,0.12)" : "transparent",
                  color: opt.active ? gold : opt.done ? "#aaa" : muted,
                  cursor: "pointer",
                  position: "relative",
                }}
                title={opt.label}
              >
                {opt.label}
                {opt.done && (
                  <span
                    style={{ position: "absolute", top: 1, right: 2, fontSize: "0.4rem", color: gold }}
                  >
                    ✓
                  </span>
                )}
              </button>
            )
          })}
          <button
            onClick={addWeek}
            title="Add a week"
            style={{
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.08em",
              padding: "5px 8px",
              border: `1px dashed ${border}`,
              background: "transparent",
              color: muted,
              cursor: "pointer",
            }}
          >
            + wk
          </button>
        </div>
      </div>

      {/* Body */}
      {isCompleted ? (
        <CompletedSummary
          exercises={existingSession!.exercises}
          day={day}
          onEdit={() => setEditing(true)}
        />
      ) : (
        <>
          {exercises.map((ex) => (
            <ExerciseBlock
              key={ex.id}
              ex={ex}
              sets={logs[ex.id] ?? defaultSets(ex, weightUnit)}
              unit={weightUnit}
              onChange={(sets) => updateExerciseSets(ex.id, sets)}
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
            <p
              style={{
                marginTop: 10,
                fontSize: "0.6rem",
                color: muted,
                fontFamily: "var(--font-montserrat), sans-serif",
                textAlign: "center",
              }}
            >
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

  const date = new Date(session.completedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
        padding: "5px 12px",
        border: `1px solid ${gold}`,
        background: "rgba(201,169,110,0.08)",
      }}
    >
      <span style={{ color: gold, fontSize: "0.7rem" }}>✓</span>
      <span
        style={{
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.6rem",
          color: gold,
          letterSpacing: "0.1em",
        }}
      >
        Week {currentPosition.week} logged · {date}
      </span>
    </div>
  )
}
