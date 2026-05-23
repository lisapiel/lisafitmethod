"use client"

import { useDayLogs } from "./DayLogsContext"
import { WORKOUT_DAYS } from "@/lib/workoutData"
import { SetLog } from "@/lib/courseProgress"

const gold = "#c9a96e"
const muted = "#888"
const border = "#2a2a2a"
const inputBg = "#1e1e1e"
const cream = "#f0e6d3"

const inp: React.CSSProperties = {
  background: inputBg,
  border: `1px solid ${border}`,
  borderRadius: 4,
  color: cream,
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: "16px",
  padding: "5px 7px",
  width: 48,
  textAlign: "center",
}

const stepBtn: React.CSSProperties = {
  background: "#252525",
  border: "none",
  color: muted,
  cursor: "pointer",
  fontSize: "0.7rem",
  width: 24,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 3,
  flexShrink: 0,
}

export default function InlineExerciseTracker({
  day,
  exerciseId,
}: {
  day: "a" | "b" | "c"
  exerciseId: string
}) {
  const { logs, updateExerciseSets, isCompleted, weekOptions, weightUnit } = useDayLogs()
  const def = WORKOUT_DAYS[day].exercises.find((e) => e.id === exerciseId)
  if (!def) return null

  const sets = logs[exerciseId] ?? []
  const activeLabel = weekOptions.find((o) => o.active)?.label ?? "Wk 1"

  const isBodyweightOnly = def.bodyweight && !def.optionalWeight
  const isDistanceTime = !!def.trackDistanceOrTime
  const STEP = 2.5

  function updateSet(i: number, s: SetLog) {
    const next = [...sets]
    next[i] = s
    updateExerciseSets(exerciseId, next)
  }

  function addSet() {
    const last = sets[sets.length - 1] ?? { reps: def!.defaultReps ?? 0, weight: 0, unit: weightUnit }
    updateExerciseSets(exerciseId, [...sets, { ...last, confirmed: false }])
  }

  function removeSet(i: number) {
    if (sets.length <= 1) return
    updateExerciseSets(exerciseId, sets.filter((_, idx) => idx !== i))
  }

  if (isCompleted) {
    const weightedSets = sets.filter((s) => s.weight > 0)
    const maxW = weightedSets.length > 0 ? Math.max(...weightedSets.map((s) => s.weight)) : null
    const distTime = sets.map((s) => s.distanceTime).find(Boolean)
    return (
      <div
        style={{
          margin: "0 0 20px",
          padding: "7px 14px",
          background: "rgba(201,169,110,0.05)",
          border: "1px solid rgba(201,169,110,0.2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ color: gold, fontSize: "0.65rem" }}>✓</span>
        <span
          style={{
            fontSize: "0.6rem",
            color: gold,
            fontFamily: "var(--font-montserrat), sans-serif",
            letterSpacing: "0.05em",
          }}
        >
          {sets.length} sets
          {maxW ? ` · ${maxW} ${sets[0]?.unit ?? weightUnit}` : isBodyweightOnly ? " · BW" : ""}
          {distTime ? ` · ${distTime}` : ""}
          {" · "}
          {activeLabel}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        margin: "0 0 20px",
        padding: "12px 14px",
        background: "#0f0f0f",
        border: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          fontSize: "0.6rem",
          color: muted,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontFamily: "var(--font-montserrat), sans-serif",
          marginBottom: 8,
        }}
      >
        {activeLabel} — log sets
      </div>

      {sets.map((set, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, flexWrap: "wrap" }}
        >
          <span
            style={{
              fontSize: "0.55rem",
              color: "#555",
              width: 22,
              fontFamily: "var(--font-montserrat), sans-serif",
              flexShrink: 0,
            }}
          >
            S{i + 1}
          </span>

          {isDistanceTime ? (
            <>
              <input
                type="text"
                value={set.distanceTime ?? ""}
                placeholder="30m"
                onChange={(e) => updateSet(i, { ...set, distanceTime: e.target.value, confirmed: false })}
                style={{ ...inp, width: 58 }}
              />
              <span
                style={{
                  fontSize: "0.55rem",
                  color: muted,
                  fontFamily: "var(--font-montserrat), sans-serif",
                }}
              >
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
                onChange={(e) => updateSet(i, { ...set, reps: Number(e.target.value), confirmed: false })}
                style={inp}
              />
              <span
                style={{
                  fontSize: "0.55rem",
                  color: muted,
                  fontFamily: "var(--font-montserrat), sans-serif",
                }}
              >
                reps
              </span>
            </>
          )}

          {isBodyweightOnly ? (
            <span
              style={{
                fontSize: "0.6rem",
                background: "#2a2a2a",
                color: muted,
                padding: "3px 7px",
                borderRadius: 3,
                fontFamily: "var(--font-montserrat), sans-serif",
              }}
            >
              BW
            </span>
          ) : (
            <>
              <button
                onClick={() =>
                  updateSet(i, { ...set, weight: Math.max(0, (set.weight ?? 0) - STEP), confirmed: false })
                }
                style={stepBtn}
              >
                −
              </button>
              <input
                type="number"
                min={0}
                step={STEP}
                value={set.weight || ""}
                placeholder="0"
                onChange={(e) => updateSet(i, { ...set, weight: Number(e.target.value), confirmed: false })}
                style={inp}
              />
              <button
                onClick={() => updateSet(i, { ...set, weight: (set.weight ?? 0) + STEP, confirmed: false })}
                style={stepBtn}
              >
                +
              </button>
              <span
                style={{
                  fontSize: "0.55rem",
                  color: muted,
                  fontFamily: "var(--font-montserrat), sans-serif",
                }}
              >
                {set.unit}
              </span>
            </>
          )}

          {/* Log Set button */}
          <button
            onClick={() => updateSet(i, { ...set, confirmed: true })}
            title={set.confirmed ? "Set logged" : "Log this set"}
            style={{
              background: set.confirmed ? "rgba(201,169,110,0.12)" : "none",
              border: `1px solid ${set.confirmed ? gold : border}`,
              color: set.confirmed ? gold : "#555",
              cursor: "pointer",
              fontSize: "0.5rem",
              fontFamily: "var(--font-montserrat), sans-serif",
              letterSpacing: "0.08em",
              padding: "3px 6px",
              borderRadius: 3,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {set.confirmed ? "✓" : "Log"}
          </button>

          {sets.length > 1 && (
            <button
              onClick={() => removeSet(i)}
              style={{
                background: "none",
                border: "none",
                color: "#444",
                cursor: "pointer",
                fontSize: "0.65rem",
                padding: "0 3px",
                lineHeight: 1,
              }}
              title="Remove set"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addSet}
        style={{
          background: "none",
          border: `1px dashed ${border}`,
          color: muted,
          fontSize: "0.55rem",
          fontFamily: "var(--font-montserrat), sans-serif",
          letterSpacing: "0.08em",
          cursor: "pointer",
          padding: "3px 8px",
          marginTop: 2,
        }}
      >
        + add set
      </button>
    </div>
  )
}
