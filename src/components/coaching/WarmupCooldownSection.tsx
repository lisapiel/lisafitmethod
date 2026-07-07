"use client"

import { useState } from "react"
import WorkoutBuilder from "./WorkoutBuilder"
import type { ProgramExercise } from "./ExerciseRow"

const gold = "#c9a96e"
const border = "#2a2a2a"

export type WarmupCooldownData = { notes: string; exercises: ProgramExercise[] }

export default function WarmupCooldownSection({
  label,
  data,
  onChange,
}: {
  label: "Warmup" | "Cooldown"
  data: WarmupCooldownData
  onChange: (next: WarmupCooldownData) => void
}) {
  const hasContent = data.notes || data.exercises.length > 0
  const [open, setOpen] = useState(hasContent)

  return (
    <div style={{ marginTop: label === "Cooldown" ? 22 : 0, marginBottom: label === "Warmup" ? 6 : 0, border: `1px solid ${border}`, background: "#0d0d0d" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: "none", padding: "10px 14px",
          fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700,
          color: gold, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer",
        }}
      >
        <span>
          {label === "Warmup" ? "🔥 " : "🧘 "}{label}
          {hasContent && (
            <span style={{ marginLeft: 10, color: "#666", fontWeight: 400 }}>
              {data.exercises.length > 0 ? `${data.exercises.length} exercise${data.exercises.length !== 1 ? "s" : ""}` : "notes only"}
            </span>
          )}
        </span>
        <span style={{ color: "#666" }}>{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", margin: "0 0 8px", lineHeight: 1.5 }}>
            {label === "Warmup"
              ? "Movement prep the client should do before their main workout. Not tracked — no sets logged. Add notes and any prescribed drills."
              : "Recovery movement + stretches after the main workout. Not tracked — no sets logged. Add notes and any specific stretches."}
          </p>

          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>
            Notes for the client
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
            placeholder={label === "Warmup"
              ? "e.g. 5 minutes on the bike + banded glute activation."
              : "e.g. Foam roll quads and IT band, 60s each. Finish with pigeon pose 30s per side."}
            rows={2}
            style={{
              width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3",
              padding: "8px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem",
              outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 12, lineHeight: 1.5,
            }}
          />

          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", margin: "0 0 6px" }}>
            Drills / Movements (optional)
          </p>
          <WorkoutBuilder
            exercises={data.exercises}
            onChange={(exs) => onChange({ ...data, exercises: exs })}
          />
        </div>
      )}
    </div>
  )
}
