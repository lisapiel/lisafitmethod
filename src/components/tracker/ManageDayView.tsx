"use client"
import { useState } from "react"
import { useTracker } from "./TrackerContext"
import { TrackerExercise } from "@/lib/trackerStorage"
import { ExerciseRow } from "./ExerciseRow"
import { AddExerciseForm } from "./AddExerciseForm"

interface ManageDayViewProps {
  dayId: string
  onBack: () => void
}

export function ManageDayView({ dayId, onBack }: ManageDayViewProps) {
  const { data, renameDay, deleteDay, addExercise, updateExercise, deleteExercise } = useTracker()
  const [addingExercise, setAddingExercise] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(false)

  const day = data.days.find((d) => d.id === dayId)
  if (!day) return null

  const sortedExercises = [...day.exercises].sort((a, b) => a.order - b.order)

  const handleRenameSave = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    renameDay(dayId, trimmed)
    setEditingName(false)
  }

  const handleDeleteDay = () => {
    deleteDay(dayId)
    onBack()
  }

  const handleAddExercise = (name: string, type: TrackerExercise["type"], notes: string) => {
    addExercise(dayId, name, type, notes)
    setAddingExercise(false)
  }

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {/* Day name */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #1a1a1a" }}>
        {editingName ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
              style={{ flex: 1, background: "#111", border: "1px solid #c9a96e", color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 16, padding: "10px 12px", outline: "none" }}
              onKeyDown={(e) => { if (e.key === "Enter") handleRenameSave(); if (e.key === "Escape") setEditingName(false) }}
            />
            <button onClick={handleRenameSave} style={{ background: "#c9a96e", border: "none", color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, fontWeight: 600, padding: "0 14px", cursor: "pointer" }}>Save</button>
            <button onClick={() => setEditingName(false)} style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, padding: "0 12px", cursor: "pointer" }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 26, fontWeight: 400, color: "#f0e6d3" }}>
              {day.name}
            </p>
            <button
              onClick={() => { setNameInput(day.name); setEditingName(true) }}
              style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", padding: "6px 12px", cursor: "pointer" }}
            >
              Rename
            </button>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>
          Exercises
        </p>

        {sortedExercises.length === 0 && !addingExercise && (
          <p style={{ fontSize: 13, color: "#444", marginBottom: 12 }}>No exercises yet.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sortedExercises.map((ex) => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              onUpdate={(patch) => updateExercise(dayId, ex.id, patch)}
              onDelete={() => deleteExercise(dayId, ex.id)}
            />
          ))}
        </div>

        {addingExercise ? (
          <AddExerciseForm
            onAdd={handleAddExercise}
            onCancel={() => setAddingExercise(false)}
          />
        ) : (
          <button
            onClick={() => setAddingExercise(true)}
            style={{ marginTop: sortedExercises.length > 0 ? 10 : 0, width: "100%", background: "none", border: "1px dashed #2a2a2a", color: "#444", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", padding: "14px 20px", cursor: "pointer" }}
          >
            + Add Exercise
          </button>
        )}
      </div>

      {/* Delete day */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #1a1a1a" }}>
        {confirmDeleteDay ? (
          <div style={{ padding: "16px", background: "#1a0808", border: "1px solid #3a1a1a", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 14 }}>Delete &ldquo;{day.name}&rdquo; and all its data?</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={handleDeleteDay} style={{ background: "#c9a96e", border: "none", color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", padding: "10px 20px", cursor: "pointer" }}>Yes, Delete</button>
              <button onClick={() => setConfirmDeleteDay(false)} style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, padding: "10px 16px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDeleteDay(true)}
            style={{ width: "100%", background: "none", border: "1px solid #2a2a2a", color: "#444", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer" }}
          >
            Delete This Day
          </button>
        )}
      </div>

      <button
        onClick={onBack}
        style={{ marginTop: 10, width: "100%", background: "none", border: "1px solid #1e1e1e", color: "#444", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer" }}
      >
        ← Back to Days
      </button>
    </div>
  )
}
