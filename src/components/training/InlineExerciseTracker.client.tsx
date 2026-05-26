"use client"

import { useDayLogs } from "./DayLogsContext"
import { WORKOUT_DAYS } from "@/lib/workoutData"
import { SetLog } from "@/lib/courseProgress"

const gold = "#c9a96e"
const muted = "#888"
const border = "#2a2a2a"

const srStyles = `
  .sr-row { display:flex; align-items:center; gap:4px; margin-bottom:6px; flex-wrap:nowrap; }
  .sr-label { font-size:0.55rem; color:#888; width:14px; flex-shrink:0; font-family:var(--font-montserrat),sans-serif; }
  .sr-inp { background:#1e1e1e; border:1px solid #2a2a2a; border-radius:4px; color:#f0e6d3; font-family:var(--font-montserrat),sans-serif; font-size:16px; padding:4px 2px; width:40px; text-align:center; flex-shrink:0; }
  .sr-inp-wide { width:58px; }
  .sr-unit { font-size:0.5rem; color:#555; font-family:var(--font-montserrat),sans-serif; flex-shrink:0; }
  .sr-bw { font-size:0.5rem; background:#222; color:#666; padding:2px 5px; border-radius:3px; font-family:var(--font-montserrat),sans-serif; flex-shrink:0; }
  .sr-log { background:none; border:1px solid #2a2a2a; color:#555; cursor:pointer; font-size:0.5rem; font-family:var(--font-montserrat),sans-serif; letter-spacing:0.06em; padding:0 6px; border-radius:3px; flex-shrink:0; white-space:nowrap; min-height:28px; display:flex; align-items:center; }
  .sr-log--done { background:rgba(201,169,110,0.12); border-color:#c9a96e; color:#c9a96e; }
  .sr-del { background:none; border:1px solid #333; color:#555; cursor:pointer; font-size:0.65rem; min-width:28px; min-height:28px; display:flex; align-items:center; justify-content:center; border-radius:3px; flex-shrink:0; margin-left:6px; }
  @media (min-width: 480px) {
    .sr-row { gap:8px; }
    .sr-label { width:22px; font-size:0.6rem; }
    .sr-inp { width:52px; padding:6px 4px; }
    .sr-inp-wide { width:72px; }
    .sr-unit { font-size:0.55rem; }
    .sr-log { font-size:0.55rem; padding:0 10px; min-height:30px; }
    .sr-del { min-width:30px; min-height:30px; font-size:0.7rem; margin-left:8px; }
  }
`

export default function InlineExerciseTracker({
  day,
  exerciseId,
}: {
  day: "a" | "b" | "c"
  exerciseId: string
}) {
  const { logs, updateExerciseSets, isCompleted, weightUnit, selectedRound, selectedWeek, weeksPerRound } = useDayLogs()
  const def = WORKOUT_DAYS[day].exercises.find((e) => e.id === exerciseId)
  if (!def) return null

  const sets = logs[exerciseId] ?? []
  const totalWeek = (selectedRound - 1) * weeksPerRound + selectedWeek
  const activeLabel = `Week ${totalWeek}`

  const isBodyweightOnly = def.bodyweight && !def.optionalWeight
  const isDistanceTime = !!def.trackDistanceOrTime

  function updateSet(i: number, s: SetLog) {
    const next = [...sets]
    next[i] = s
    updateExerciseSets(exerciseId, next)
  }

  function removeSet(i: number) {
    updateExerciseSets(exerciseId, sets.filter((_, idx) => idx !== i))
  }

  function addSet() {
    const last = sets[sets.length - 1] ?? {
      reps: def!.defaultReps ?? 0,
      weight: 0,
      unit: weightUnit,
      distanceTime: isDistanceTime ? "" : undefined,
    }
    updateExerciseSets(exerciseId, [...sets, { ...last, confirmed: false }])
  }

  if (isCompleted) {
    return (
      <div
        style={{
          margin: "0 0 20px",
          padding: "8px 14px",
          background: "rgba(201,169,110,0.05)",
          border: "1px solid rgba(201,169,110,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ color: gold, fontSize: "0.6rem" }}>✓</span>
          <span style={{ fontSize: "0.55rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {activeLabel}
          </span>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {sets.map((set, i) => {
            const label = isDistanceTime
              ? set.distanceTime || "—"
              : set.reps > 0
              ? `${set.reps} reps${set.weight > 0 ? ` · ${set.weight} wt` : isBodyweightOnly ? " · BW" : ""}`
              : "—"
            return (
              <span
                key={i}
                style={{
                  fontSize: "0.6rem",
                  color: muted,
                  fontFamily: "var(--font-montserrat), sans-serif",
                  background: "#1a1a1a",
                  padding: "2px 7px",
                  borderRadius: 3,
                  border: `1px solid ${border}`,
                }}
              >
                S{i + 1}: {label}
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        margin: "0 0 12px",
        padding: "12px 14px",
        background: "#0f0f0f",
        border: `1px solid ${border}`,
      }}
    >
      <style>{srStyles}</style>

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
        {activeLabel} · Log Sets
      </div>

      {sets.map((set, i) => (
        <div key={i} className="sr-row">
          <span className="sr-label">S{i + 1}</span>

          {isDistanceTime ? (
            <>
              <input
                type="text"
                value={set.distanceTime ?? ""}
                placeholder="30m"
                onChange={(e) => updateSet(i, { ...set, distanceTime: e.target.value, confirmed: false })}
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
                onChange={(e) => updateSet(i, { ...set, reps: Number(e.target.value), confirmed: false })}
                className="sr-inp"
              />
              <span className="sr-unit">reps</span>
            </>
          )}

          {isBodyweightOnly ? (
            <span className="sr-bw">BW</span>
          ) : (
            <>
              <input
                type="number"
                min={0}
                value={set.weight || ""}
                placeholder="wt"
                onChange={(e) => updateSet(i, { ...set, weight: Number(e.target.value), confirmed: false })}
                className="sr-inp"
              />
              <span className="sr-unit">wt</span>
            </>
          )}

          <button
            onClick={() => updateSet(i, { ...set, confirmed: true })}
            title={set.confirmed ? "Set logged" : "Log this set"}
            className={`sr-log${set.confirmed ? " sr-log--done" : ""}`}
          >
            {set.confirmed ? "✓" : "Log"}
          </button>

          {sets.length > 1 && (
            <button onClick={() => removeSet(i)} className="sr-del" title="Remove set">✕</button>
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
