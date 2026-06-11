"use client"

import { useState } from "react"
import ExerciseRow, { emptyExercise } from "./ExerciseRow"
import type { ProgramExercise } from "./ExerciseRow"
import ExerciseSearchModal from "./ExerciseSearchModal"
import type { SearchExercise } from "./ExerciseSearchModal"

const gold = "#c9a96e"
const border = "#2a2a2a"

export default function WorkoutBuilder({ exercises, onChange }: {
  exercises: ProgramExercise[]
  onChange: (next: ProgramExercise[]) => void
}) {
  const [showSearch, setShowSearch] = useState(false)
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null)

  function addExercise(ex: SearchExercise) {
    onChange([...exercises, emptyExercise(ex)])
  }

  function updateExercise(idx: number, updated: ProgramExercise) {
    onChange(exercises.map((e, i) => i === idx ? updated : e))
  }

  function removeExercise(idx: number) {
    onChange(exercises.filter((_, i) => i !== idx))
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const next = [...exercises]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    onChange(next)
  }

  function moveDown(idx: number) {
    if (idx === exercises.length - 1) return
    const next = [...exercises]
    ;[next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]
    onChange(next)
  }

  function replaceExercise(idx: number) {
    setReplaceIdx(idx)
    setShowSearch(true)
  }

  function handleSelectFromSearch(ex: SearchExercise) {
    if (replaceIdx !== null) {
      // Preserve sets/reps/etc. when replacing — only swap the exercise reference
      onChange(exercises.map((e, i) => i !== replaceIdx ? e : {
        ...e,
        exerciseId: ex.id,
        name: ex.name,
        videoS3Key: ex.videoS3Key ?? "",
      }))
      setReplaceIdx(null)
    } else {
      addExercise(ex)
    }
  }

  return (
    <>
      {exercises.length === 0 ? (
        <div style={{ background: "#0f0f0f", border: `1px dashed ${border}`, padding: "2.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#444", marginBottom: 16 }}>No exercises yet.</p>
          <button onClick={() => { setReplaceIdx(null); setShowSearch(true) }} style={{ background: gold, color: "#0a0a0a", border: "none", padding: "10px 22px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
            + Add Exercise
          </button>
        </div>
      ) : (
        <div>
          {exercises.map((ex, i) => (
            <ExerciseRow
              key={i}
              ex={ex}
              onUpdate={(u) => updateExercise(i, u)}
              onRemove={() => removeExercise(i)}
              onReplace={() => replaceExercise(i)}
              onMoveUp={() => moveUp(i)}
              onMoveDown={() => moveDown(i)}
              canMoveUp={i > 0}
              canMoveDown={i < exercises.length - 1}
            />
          ))}
          <button onClick={() => { setReplaceIdx(null); setShowSearch(true) }} style={{ background: "none", border: `1px dashed ${border}`, color: "#555", padding: "10px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", width: "100%", marginTop: 4 }}>
            + Add Exercise
          </button>
        </div>
      )}

      {showSearch && (
        <ExerciseSearchModal
          onSelect={handleSelectFromSearch}
          onClose={() => { setShowSearch(false); setReplaceIdx(null) }}
          title={replaceIdx !== null ? "Replace exercise" : "Add exercise"}
        />
      )}
    </>
  )
}
