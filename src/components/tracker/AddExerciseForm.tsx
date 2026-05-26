"use client"
import { useState } from "react"
import { TrackerExercise } from "@/lib/trackerStorage"

interface AddExerciseFormProps {
  onAdd: (name: string, type: TrackerExercise["type"], notes: string) => void
  onCancel: () => void
}

const TYPES: { value: TrackerExercise["type"]; label: string }[] = [
  { value: "weight_reps", label: "Weight + Reps" },
  { value: "reps_only", label: "Reps Only" },
  { value: "time", label: "Time" },
]

export function AddExerciseForm({ onAdd, onCancel }: AddExerciseFormProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<TrackerExercise["type"]>("weight_reps")
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, type, notes.trim())
  }

  const inputBase: React.CSSProperties = {
    display: "block",
    width: "100%",
    background: "#161616",
    border: "1px solid #2a2a2a",
    color: "#f0e6d3",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: 14,
    padding: "12px 14px",
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16, padding: "16px", background: "#111111", border: "1px solid #c9a96e" }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 14 }}>
        Add Exercise
      </p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Exercise name…"
        autoFocus
        style={{ ...inputBase, marginBottom: 12 }}
      />

      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 9, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Tracking type</p>
        <div style={{ display: "flex", gap: 6 }}>
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              style={{
                flex: 1,
                background: type === t.value ? "rgba(201,169,110,0.12)" : "#161616",
                border: type === t.value ? "1px solid #c9a96e" : "1px solid #2a2a2a",
                color: type === t.value ? "#c9a96e" : "#555",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "10px 4px",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => setShowNotes((n) => !n)}
          style={{ background: "none", border: "none", color: "#444", fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}
        >
          <span style={{ fontSize: 14, color: showNotes ? "#c9a96e" : "#444" }}>{showNotes ? "−" : "+"}</span>
          Add personal notes / cues
        </button>
        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. keep chest up, pause at bottom…"
            rows={2}
            style={{ ...inputBase, marginTop: 8, resize: "vertical" as const, fontStyle: "italic" }}
          />
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={!name.trim()}
          style={{
            flex: 1,
            background: name.trim() ? "#c9a96e" : "#1a1a1a",
            border: "none",
            color: name.trim() ? "#0a0a0a" : "#333",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "13px 20px",
            cursor: name.trim() ? "pointer" : "default",
          }}
        >
          Add Exercise
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, padding: "13px 16px", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
