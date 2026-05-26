"use client"
import { SetLog, TrackerExercise, DayWorkoutLog } from "@/lib/trackerStorage"
import { SetRow } from "./SetRow"

interface ExerciseLogBlockProps {
  exercise: TrackerExercise
  currentLog: DayWorkoutLog | undefined
  prevLog: DayWorkoutLog | undefined
  weightUnit: "lbs" | "kg"
  onAddSet: (values: { weight?: number; reps?: number; minutes?: number; seconds?: number }) => void
  onRemoveSet: (setIndex: number) => void
}

function formatSet(s: SetLog, type: TrackerExercise["type"], unit: string): string {
  if (type === "weight_reps") {
    return `${s.reps ?? 0} × ${s.weight ?? 0} ${unit}`
  }
  if (type === "reps_only") {
    return `${s.reps ?? 0} reps`
  }
  if (type === "time") {
    const m = s.minutes ?? 0
    const sec = s.seconds ?? 0
    return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`
  }
  return ""
}

export function ExerciseLogBlock({
  exercise,
  currentLog,
  prevLog,
  weightUnit,
  onAddSet,
  onRemoveSet,
}: ExerciseLogBlockProps) {
  const currentSets = (currentLog?.sets ?? []).filter((s) => s.exerciseId === exercise.id)
  const prevSets = (prevLog?.sets ?? []).filter((s) => s.exerciseId === exercise.id)

  const typeBadge: Record<TrackerExercise["type"], string> = {
    weight_reps: "Weight + Reps",
    reps_only: "Reps Only",
    time: "Time",
  }

  return (
    <div style={{ background: "#111111", border: "1px solid #1e1e1e", padding: "16px" }}>
      {/* Exercise header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#f0e6d3", marginBottom: 3, letterSpacing: "0.02em" }}>
            {exercise.name}
          </p>
          <span style={{ fontSize: 9, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase", background: "#161616", padding: "2px 8px", border: "1px solid #222" }}>
            {typeBadge[exercise.type]}
          </span>
        </div>
        {currentSets.length > 0 && (
          <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.05em" }}>
            {currentSets.length} {currentSets.length === 1 ? "set" : "sets"}
          </span>
        )}
      </div>

      {/* Previous week reference */}
      {prevSets.length > 0 && (
        <div style={{ marginBottom: 12, padding: "8px 10px", background: "#0d0d0d", borderLeft: "2px solid #2a2a2a" }}>
          <p style={{ fontSize: 9, color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
            Last week
          </p>
          <p style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>
            {prevSets.map((s) => formatSet(s, exercise.type, weightUnit)).join("  ·  ")}
          </p>
        </div>
      )}

      {/* Logged sets */}
      {currentSets.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {currentSets.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "rgba(201,169,110,0.05)", border: "1px solid rgba(201,169,110,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em", width: 14 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 13, color: "#f0e6d3", fontWeight: 500 }}>
                  {formatSet(s, exercise.type, weightUnit)}
                </span>
              </div>
              <button
                onClick={() => onRemoveSet(i)}
                style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 14, padding: "2px 4px", lineHeight: 1 }}
                aria-label="Remove set"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Personal notes */}
      {exercise.notes && (
        <p style={{ fontSize: 11, color: "#444", fontStyle: "italic", marginBottom: 10, lineHeight: 1.5, borderLeft: "1px solid #222", paddingLeft: 8 }}>
          {exercise.notes}
        </p>
      )}

      {/* Add set input */}
      <SetRow
        exerciseType={exercise.type}
        weightUnit={weightUnit}
        onLog={onAddSet}
      />
    </div>
  )
}
