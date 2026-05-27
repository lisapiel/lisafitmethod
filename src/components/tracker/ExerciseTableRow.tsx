"use client"
import { useState } from "react"
import { useTracker } from "./TrackerContext"
import { TrackerExercise, SetLog } from "@/lib/trackerStorage"

const gold = "#c9a96e"
const muted = "#555"
const rowBorder = "#1e1e1e"

interface ExerciseTableRowProps {
  exercise: TrackerExercise
  dayId: string
  weekId: string
  loggedSets: SetLog[]
  prevSets: SetLog[]
  weightUnit: "lbs" | "kg"
}

interface PendingSet {
  weight: string
  reps: string
  minutes: string
  seconds: string
}

function emptyPending(): PendingSet {
  return { weight: "", reps: "", minutes: "", seconds: "" }
}

const inputStyle: React.CSSProperties = {
  background: "#161616",
  border: "1px solid #2a2a2a",
  color: "#f0e6d3",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: 13,
  padding: "6px 5px",
  textAlign: "center",
  outline: "none",
  WebkitAppearance: "none",
  MozAppearance: "textfield",
  boxSizing: "border-box",
  minWidth: 0,
}

const setLabelStyle: React.CSSProperties = {
  fontSize: 9,
  color: muted,
  fontFamily: "var(--font-montserrat), sans-serif",
  flexShrink: 0,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
}

export function ExerciseTableRow({ exercise, dayId, weekId, loggedSets, prevSets, weightUnit }: ExerciseTableRowProps) {
  const { addSet, removeSet, deleteExercise } = useTracker()
  const [pendingRows, setPendingRows] = useState<PendingSet[]>(() => {
    const count = Math.max(3 - loggedSets.length, loggedSets.length === 0 ? 3 : 1)
    return Array.from({ length: count }, emptyPending)
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const updatePending = (index: number, field: keyof PendingSet, value: string) => {
    setPendingRows(pendingRows.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const removePendingRow = (index: number) => {
    setPendingRows(pendingRows.filter((_, i) => i !== index))
  }

  const handleLog = (rowIndex: number) => {
    const p = pendingRows[rowIndex]
    const base: Omit<SetLog, "setNumber"> = { exerciseId: exercise.id }

    if (exercise.type === "weight_reps") {
      const w = parseFloat(p.weight)
      const r = parseInt(p.reps)
      if (!w || !r) return
      Object.assign(base, { weight: w, unit: weightUnit, reps: r })
    } else if (exercise.type === "reps_only") {
      const r = parseInt(p.reps)
      if (!r) return
      Object.assign(base, { reps: r })
    } else if (exercise.type === "time") {
      const m = parseInt(p.minutes) || 0
      const s = parseInt(p.seconds) || 0
      if (!m && !s) return
      Object.assign(base, { minutes: m, seconds: s })
    } else if (exercise.type === "weight_time") {
      const w = parseFloat(p.weight)
      const m = parseInt(p.minutes) || 0
      const s = parseInt(p.seconds) || 0
      if (!w || (!m && !s)) return
      Object.assign(base, { weight: w, unit: weightUnit, minutes: m, seconds: s })
    }

    addSet(weekId, dayId, base)
    setPendingRows(pendingRows.filter((_, i) => i !== rowIndex))
  }

  const handleRemoveLogged = (setIndex: number) => {
    removeSet(weekId, dayId, exercise.id, setIndex)
    setPendingRows([...pendingRows, emptyPending()])
  }

  const formatPrevSet = (s: SetLog) => {
    if (exercise.type === "weight_reps") return `${s.weight ?? "?"}×${s.reps ?? "?"}`
    if (exercise.type === "reps_only") return `${s.reps ?? "?"} reps`
    if (exercise.type === "time") return `${s.minutes ?? 0}:${String(s.seconds ?? 0).padStart(2, "0")}`
    if (exercise.type === "weight_time") return `${s.weight ?? "?"}${s.unit ?? weightUnit} · ${s.minutes ?? 0}:${String(s.seconds ?? 0).padStart(2, "0")}`
    return ""
  }

  const typeBadge =
    exercise.type === "weight_reps" ? "Weight + Reps" :
    exercise.type === "reps_only" ? "Reps Only" :
    exercise.type === "time" ? "Time" : "Weight + Time"

  return (
    <div style={{ borderBottom: `1px solid ${rowBorder}`, padding: "16px 16px 12px" }}>
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      {/* Exercise header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "#f0e6d3" }}>
            {exercise.name}
          </span>
          <span style={{ marginLeft: 8, fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#3a3a3a", fontFamily: "var(--font-montserrat), sans-serif" }}>
            {typeBadge}
          </span>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          style={{ background: "none", border: "none", color: "#2a2a2a", cursor: "pointer", padding: "4px 2px", fontSize: "1.1rem", lineHeight: 1 }}
          aria-label="Remove exercise"
        >
          ×
        </button>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#1a1a1a", border: "1px solid #2a2a2a", padding: "10px 12px", marginBottom: 10 }}>
          <span style={{ fontSize: "0.6rem", color: "#aaa", fontFamily: "var(--font-montserrat), sans-serif", flex: 1 }}>
            Remove {exercise.name}?
          </span>
          <button
            onClick={() => deleteExercise(dayId, exercise.id)}
            style={{ background: gold, border: "none", color: "#0a0a0a", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", padding: "6px 12px", fontFamily: "var(--font-montserrat), sans-serif" }}
          >
            Remove
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{ background: "none", border: "none", color: muted, fontSize: "0.6rem", cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif" }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Prev week reference */}
      {prevSets.length > 0 && (
        <div style={{ marginBottom: 8, fontSize: "0.58rem", color: "#2e2e2e", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.04em" }}>
          Last week: {prevSets.map(formatPrevSet).join(" · ")}
        </div>
      )}

      {/* Logged sets */}
      {loggedSets.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 9, color: "#3a3a3a", fontFamily: "var(--font-montserrat), sans-serif", width: 26, flexShrink: 0 }}>
            Set {i + 1}
          </span>
          <span style={{ fontSize: "0.65rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", flex: 1 }}>
            {exercise.type === "weight_reps" && `${s.weight ?? ""} ${s.unit ?? weightUnit}  ·  ${s.reps ?? ""} reps`}
            {exercise.type === "reps_only" && `${s.reps ?? ""} reps`}
            {exercise.type === "time" && `${s.minutes ?? 0}:${String(s.seconds ?? 0).padStart(2, "0")}`}
            {exercise.type === "weight_time" && `${s.weight ?? ""} ${s.unit ?? weightUnit}  ·  ${s.minutes ?? 0}:${String(s.seconds ?? 0).padStart(2, "0")}`}
          </span>
          <span style={{ color: gold, fontSize: "0.7rem" }}>✓</span>
          <button
            onClick={() => handleRemoveLogged(i)}
            style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "1rem", padding: "0 2px", lineHeight: 1 }}
            aria-label="Remove set"
          >
            ×
          </button>
        </div>
      ))}

      {/* Pending input rows */}
      {pendingRows.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6, flexWrap: "nowrap" }}>
          <span style={{ ...setLabelStyle, width: 26 }}>
            Set {loggedSets.length + i + 1}
          </span>

          {exercise.type === "weight_reps" && (
            <>
              <input
                type="number"
                inputMode="decimal"
                placeholder={weightUnit}
                value={p.weight}
                onChange={(e) => updatePending(i, "weight", e.target.value)}
                style={{ ...inputStyle, width: 58 }}
              />
              <span style={setLabelStyle}>Weight</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={p.reps}
                onChange={(e) => updatePending(i, "reps", e.target.value)}
                style={{ ...inputStyle, width: 50 }}
              />
              <span style={setLabelStyle}>Reps</span>
            </>
          )}

          {exercise.type === "reps_only" && (
            <>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={p.reps}
                onChange={(e) => updatePending(i, "reps", e.target.value)}
                style={{ ...inputStyle, width: 58 }}
              />
              <span style={setLabelStyle}>Reps</span>
            </>
          )}

          {exercise.type === "time" && (
            <>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={p.minutes}
                onChange={(e) => updatePending(i, "minutes", e.target.value)}
                style={{ ...inputStyle, width: 44 }}
              />
              <span style={{ fontSize: 9, color: "#333", flexShrink: 0 }}>:</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="00"
                value={p.seconds}
                onChange={(e) => updatePending(i, "seconds", e.target.value)}
                style={{ ...inputStyle, width: 44 }}
              />
              <span style={setLabelStyle}>Time</span>
            </>
          )}

          {exercise.type === "weight_time" && (
            <>
              <input
                type="number"
                inputMode="decimal"
                placeholder={weightUnit}
                value={p.weight}
                onChange={(e) => updatePending(i, "weight", e.target.value)}
                style={{ ...inputStyle, width: 54 }}
              />
              <span style={setLabelStyle}>Weight</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={p.minutes}
                onChange={(e) => updatePending(i, "minutes", e.target.value)}
                style={{ ...inputStyle, width: 38 }}
              />
              <span style={{ fontSize: 9, color: "#333", flexShrink: 0 }}>:</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="00"
                value={p.seconds}
                onChange={(e) => updatePending(i, "seconds", e.target.value)}
                style={{ ...inputStyle, width: 38 }}
              />
            </>
          )}

          <button
            onClick={() => handleLog(i)}
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              color: gold,
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "6px 8px",
              flexShrink: 0,
            }}
          >
            Log
          </button>

          <button
            onClick={() => removePendingRow(i)}
            style={{
              background: "none",
              border: "none",
              color: "#444",
              cursor: "pointer",
              fontSize: "1rem",
              padding: "0 2px",
              lineHeight: 1,
              flexShrink: 0,
            }}
            aria-label="Remove set row"
          >
            ×
          </button>
        </div>
      ))}

      {/* Add Set */}
      <button
        onClick={() => setPendingRows([...pendingRows, emptyPending()])}
        style={{
          background: "none",
          border: "none",
          color: "#3a3a3a",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.55rem",
          letterSpacing: "0.1em",
          cursor: "pointer",
          padding: "6px 0 0",
          display: "flex",
          alignItems: "center",
          gap: 4,
          textTransform: "uppercase",
        }}
      >
        + Add Set
      </button>
    </div>
  )
}
