"use client"
import { useState } from "react"
import { TrackerExercise } from "@/lib/trackerStorage"

interface SetRowProps {
  exerciseType: TrackerExercise["type"]
  weightUnit: "lbs" | "kg"
  onLog: (values: { weight?: number; reps?: number; minutes?: number; seconds?: number }) => void
}

export function SetRow({ exerciseType, weightUnit, onLog }: SetRowProps) {
  const [weight, setWeight] = useState("")
  const [reps, setReps] = useState("")
  const [minutes, setMinutes] = useState("")
  const [seconds, setSeconds] = useState("")

  const canLog = () => {
    if (exerciseType === "weight_reps") return !!weight && !!reps
    if (exerciseType === "reps_only") return !!reps
    if (exerciseType === "time") return !!(minutes || seconds)
    return false
  }

  const handleLog = () => {
    if (!canLog()) return
    onLog({
      weight: exerciseType === "weight_reps" ? parseFloat(weight) : undefined,
      reps: (exerciseType === "weight_reps" || exerciseType === "reps_only") ? parseInt(reps, 10) : undefined,
      minutes: exerciseType === "time" ? (parseInt(minutes, 10) || 0) : undefined,
      seconds: exerciseType === "time" ? (parseInt(seconds, 10) || 0) : undefined,
    })
    setWeight("")
    setReps("")
    setMinutes("")
    setSeconds("")
  }

  const inputBase: React.CSSProperties = {
    background: "#161616",
    border: "1px solid #2a2a2a",
    color: "#f0e6d3",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: 16,
    padding: "10px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      {exerciseType === "weight_reps" && (
        <>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>{weightUnit}</div>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0"
              style={inputBase}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Reps</div>
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="0"
              style={inputBase}
            />
          </div>
        </>
      )}

      {exerciseType === "reps_only" && (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Reps</div>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="0"
            style={inputBase}
          />
        </div>
      )}

      {exerciseType === "time" && (
        <>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Min</div>
            <input
              type="number"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="0"
              style={inputBase}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Sec</div>
            <input
              type="number"
              inputMode="numeric"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              placeholder="0"
              style={inputBase}
            />
          </div>
        </>
      )}

      <button
        onClick={handleLog}
        disabled={!canLog()}
        style={{
          background: canLog() ? "#c9a96e" : "#1a1a1a",
          border: "none",
          color: canLog() ? "#0a0a0a" : "#333",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          padding: "11px 14px",
          cursor: canLog() ? "pointer" : "default",
          flexShrink: 0,
          alignSelf: "flex-end",
          height: 42,
        }}
      >
        Log
      </button>
    </div>
  )
}
