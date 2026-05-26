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

type DayKey = "a" | "b" | "c"


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
  return (
    <div className="sr-row">
      <span className="sr-label">Set {index + 1}</span>

      {distanceOrTime ? (
        <>
          <input
            type="text"
            value={set.distanceTime ?? ""}
            placeholder="e.g. 30m"
            onChange={(e) => {
              const v = e.target.value
              onChange({ ...set, distanceTime: v, confirmed: false })
            }}
            className="sr-inp sr-inp-wide"
          />
          <span className="sr-unit">dist</span>
        </>
      ) : (
        <>
          <input
            type="number"
            min={0}
            value={set.reps || ""}
            placeholder="reps"
            onChange={(e) => {
              const reps = Number(e.target.value)
              onChange({ ...set, reps, confirmed: false })
            }}
            className="sr-inp"
          />
          <span className="sr-unit">reps</span>
        </>
      )}

      {bodyweightOnly ? (
        <span className="sr-bw">BW</span>
      ) : (
        <>
          <input
            type="number"
            min={0}
            value={set.weight || ""}
            placeholder="wt"
            onChange={(e) => onChange({ ...set, weight: Number(e.target.value), confirmed: false })}
            className="sr-inp"
          />
          <span className="sr-unit">weight</span>
        </>
      )}

      <button
        onClick={() => onChange({ ...set, confirmed: true })}
        title={set.confirmed ? "Set logged" : "Log this set"}
        className={`sr-log${set.confirmed ? " sr-log--done" : ""}`}
      >
        {set.confirmed ? "✓" : "Log"}
      </button>

      {canRemove && (
        <button onClick={onRemove} className="sr-del" title="Remove set">✕</button>
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
    onChange([...sets, { ...last, confirmed: false }])
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
        const isBodyweightOnly = def.bodyweight && !def.optionalWeight
        const isDistTime = !!def.trackDistanceOrTime
        return (
          <div key={ex.exerciseId} style={{ padding: "8px 0", borderBottom: `1px solid ${border}` }}>
            <span style={{ fontSize: "0.65rem", color: "#aaa", fontFamily: "var(--font-montserrat), sans-serif", display: "block", marginBottom: 4 }}>
              {def.name}
            </span>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {ex.sets.map((set, i) => {
                const label = isDistTime
                  ? set.distanceTime || "—"
                  : set.reps > 0
                  ? `${set.reps} reps${set.weight > 0 ? ` · ${set.weight}${set.unit}` : isBodyweightOnly ? " · BW" : ""}`
                  : "—"
                return (
                  <span
                    key={i}
                    style={{
                      fontSize: "0.6rem",
                      color: gold,
                      fontFamily: "var(--font-montserrat), sans-serif",
                      background: "rgba(201,169,110,0.08)",
                      padding: "2px 7px",
                      borderRadius: 3,
                    }}
                  >
                    S{i + 1}: {label}
                  </span>
                )
              })}
            </div>
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
  const { ready, currentPosition } = useCourseProgress()
  const {
    selectedRound, selectedWeek,
    logs, updateExerciseSets, handleComplete, existingSession, isCompleted,
    setSelectedRound, setSelectedWeek, setEditing,
    weekOptions, addWeek, weightUnit, isControlled,
  } = useDayLogs()

  if (!ready) return null

  const exercises = WORKOUT_DAYS[day].exercises

  // Navigation helpers
  const activeIdx = weekOptions.findIndex((o) => o.active)
  const prevOpt = activeIdx > 0 ? weekOptions[activeIdx - 1] : null
  const nextOpt = activeIdx < weekOptions.length - 1 ? weekOptions[activeIdx + 1] : null
  const weeksPerRound = weekOptions.filter((o) => o.round === 1).length

  const isOnCurrentWeek =
    selectedRound === currentPosition.round && selectedWeek === currentPosition.week

  function goTo(opt: { round: number; week: number }) {
    setSelectedRound(opt.round)
    setSelectedWeek(opt.week)
    setEditing(false)
  }

  function goToCurrentWeek() {
    setSelectedRound(currentPosition.round)
    setSelectedWeek(currentPosition.week)
    setEditing(false)
  }

  const weekLabel =
    selectedRound === 1
      ? `Week ${selectedWeek} of ${weeksPerRound}`
      : `Round ${selectedRound} · Week ${selectedWeek}`

  return (
    <div
      style={{
        margin: isControlled ? "0" : "48px 0 0",
        border: isCompleted ? `1px solid ${gold}` : `1px solid ${border}`,
        background: cardBg,
        padding: "28px 28px 32px",
        transition: "border-color 0.2s",
      }}
    >
      <style>{`
        .sr-row { display:flex; align-items:center; gap:6px; margin-bottom:6px; flex-wrap:nowrap; }
        .sr-label { font-size:0.5rem; color:#888; flex-shrink:0; white-space:nowrap; font-family:var(--font-montserrat),sans-serif; }
        .sr-inp { background:#1e1e1e; border:1px solid #2a2a2a; border-radius:4px; color:#f0e6d3; font-family:var(--font-montserrat),sans-serif; font-size:16px; padding:4px 2px; width:36px; text-align:center; flex-shrink:0; }
        .sr-inp-wide { width:54px; }
        .sr-unit { font-size:0.45rem; color:#555; font-family:var(--font-montserrat),sans-serif; flex-shrink:0; }
        .sr-bw { font-size:0.5rem; background:#222; color:#666; padding:2px 5px; border-radius:3px; font-family:var(--font-montserrat),sans-serif; flex-shrink:0; }
        .sr-log { background:none; border:1px solid #2a2a2a; color:#555; cursor:pointer; font-size:0.48rem; font-family:var(--font-montserrat),sans-serif; letter-spacing:0.06em; padding:0 5px; border-radius:3px; flex-shrink:0; white-space:nowrap; min-height:28px; display:flex; align-items:center; }
        .sr-log--done { background:rgba(201,169,110,0.12); border-color:#c9a96e; color:#c9a96e; }
        .sr-del { background:none; border:1px solid #333; color:#555; cursor:pointer; font-size:0.65rem; min-width:28px; min-height:28px; display:flex; align-items:center; justify-content:center; border-radius:3px; flex-shrink:0; margin-left:6px; }
        @media (min-width: 480px) {
          .sr-row { gap:8px; }
          .sr-label { font-size:0.55rem; }
          .sr-inp { width:52px; padding:6px 4px; }
          .sr-inp-wide { width:68px; }
          .sr-unit { font-size:0.5rem; }
          .sr-log { font-size:0.55rem; padding:0 10px; min-height:30px; }
          .sr-del { min-width:30px; min-height:30px; font-size:0.7rem; margin-left:8px; }
        }
      `}</style>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isControlled ? 20 : 12,
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
      </div>

      {/* Week selector — hidden in controlled mode (parent owns selection) */}
      {!isControlled && (
        <div style={{ marginBottom: 20 }}>
          {/* Tier 1 — arrow navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => prevOpt && goTo(prevOpt)}
              disabled={!prevOpt}
              style={{
                background: "none",
                border: `1px solid ${border}`,
                color: prevOpt ? cream : "#333",
                cursor: prevOpt ? "pointer" : "default",
                fontSize: "0.75rem",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
                flexShrink: 0,
              }}
              title="Previous week"
            >
              ←
            </button>

            <span
              style={{
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: cream,
                minWidth: 140,
                textAlign: "center",
              }}
            >
              {weekLabel}
            </span>

            <button
              onClick={() => nextOpt && goTo(nextOpt)}
              disabled={!nextOpt}
              style={{
                background: "none",
                border: `1px solid ${border}`,
                color: nextOpt ? cream : "#333",
                cursor: nextOpt ? "pointer" : "default",
                fontSize: "0.75rem",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
                flexShrink: 0,
              }}
              title="Next week"
            >
              →
            </button>

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
                marginLeft: 4,
              }}
            >
              + wk
            </button>
          </div>

          {/* Back-to-current-week link */}
          {!isOnCurrentWeek && (
            <button
              onClick={goToCurrentWeek}
              style={{
                background: "none",
                border: "none",
                color: muted,
                fontSize: "0.55rem",
                fontFamily: "var(--font-montserrat), sans-serif",
                letterSpacing: "0.08em",
                cursor: "pointer",
                padding: "0 0 6px",
                textDecoration: "underline",
                display: "block",
              }}
            >
              ← Back to current week
            </button>
          )}

          {/* Tier 2 — quick-jump pills */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {weekOptions.map((opt) => (
              <button
                key={`${opt.round}-${opt.week}`}
                onClick={() => goTo(opt)}
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
            ))}
          </div>
        </div>
      )}

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

// Button placed inline after cool-down, for people going through the page with videos
export function MarkCompleteButton() {
  const { isCompleted, handleComplete, setEditing } = useDayLogs()
  if (isCompleted) {
    return (
      <div
        style={{
          margin: "20px 0",
          padding: "14px 20px",
          border: `1px solid ${gold}`,
          background: "rgba(201,169,110,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ color: gold, fontSize: "0.85rem" }}>✓</span>
        <span style={{ fontSize: "0.65rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em" }}>
          Session logged
        </span>
        <button
          onClick={() => setEditing(true)}
          style={{ marginLeft: "auto", background: "none", border: `1px solid ${border}`, color: muted, fontSize: "0.55rem", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", padding: "5px 10px" }}
        >
          Edit
        </button>
      </div>
    )
  }
  return (
    <div style={{ margin: "20px 0" }}>
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
      <p style={{ marginTop: 8, fontSize: "0.6rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", textAlign: "center" }}>
        Tap here when you are done with your workout.
      </p>
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
