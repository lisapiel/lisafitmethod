"use client"
import { useState } from "react"
import { TrackerExercise } from "@/lib/trackerStorage"

interface ExerciseRowProps {
  exercise: TrackerExercise
  onUpdate: (patch: Partial<Pick<TrackerExercise, "name" | "type" | "notes">>) => void
  onDelete: () => void
}

const TYPE_LABELS: Record<TrackerExercise["type"], string> = {
  weight_reps: "Weight + Reps",
  reps_only: "Reps Only",
  time: "Time",
  weight_time: "Weight + Time",
}

export function ExerciseRow({ exercise, onUpdate, onDelete }: ExerciseRowProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(exercise.name)
  const [notes, setNotes] = useState(exercise.notes)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSave = () => {
    if (!name.trim()) return
    onUpdate({ name: name.trim(), notes: notes.trim() })
    setEditing(false)
  }

  const handleCancel = () => {
    setName(exercise.name)
    setNotes(exercise.notes)
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ padding: "14px", background: "#161616", border: "1px solid #c9a96e" }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          style={{ display: "block", width: "100%", background: "#111", border: "1px solid #2a2a2a", color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 14, padding: "10px 12px", outline: "none", marginBottom: 10, boxSizing: "border-box" as const }}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Personal notes / cues (optional)"
          rows={2}
          style={{ display: "block", width: "100%", background: "#111", border: "1px solid #2a2a2a", color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 13, padding: "10px 12px", outline: "none", marginBottom: 10, resize: "vertical" as const, boxSizing: "border-box" as const, fontStyle: "italic" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={!name.trim()} style={{ flex: 1, background: "#c9a96e", border: "none", color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", padding: "10px", cursor: "pointer" }}>Save</button>
          <button onClick={handleCancel} style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, padding: "10px 14px", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    )
  }

  if (confirmDelete) {
    return (
      <div style={{ padding: "12px 14px", background: "#1a0808", border: "1px solid #3a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#888" }}>Delete &ldquo;{exercise.name}&rdquo;?</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onDelete} style={{ background: "#c9a96e", border: "none", color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", padding: "8px 14px", cursor: "pointer" }}>Delete</button>
          <button onClick={() => setConfirmDelete(false)} style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, padding: "8px 12px", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#111111", border: "1px solid #1e1e1e" }}>
      <div>
        <p style={{ fontSize: 13, color: "#f0e6d3", fontWeight: 500, marginBottom: 2 }}>{exercise.name}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", background: "#161616", padding: "2px 7px", border: "1px solid #222" }}>
            {TYPE_LABELS[exercise.type]}
          </span>
          {exercise.notes && <span style={{ fontSize: 10, color: "#444", fontStyle: "italic" }}>has notes</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => setEditing(true)}
          style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 9, letterSpacing: "0.1em", padding: "6px 10px", cursor: "pointer" }}
        >
          Edit
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 9, letterSpacing: "0.1em", padding: "6px 10px", cursor: "pointer" }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
