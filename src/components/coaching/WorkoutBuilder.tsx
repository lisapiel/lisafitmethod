"use client"

import { useState } from "react"
import ExerciseRow, { emptyExercise } from "./ExerciseRow"
import type { ProgramExercise } from "./ExerciseRow"
import ExerciseSearchModal from "./ExerciseSearchModal"
import type { SearchExercise } from "./ExerciseSearchModal"

const gold = "#c9a96e"
const border = "#2a2a2a"

// 16 hex chars is enough entropy for a superset group id, and short enough
// to stay readable in the raw weeks JSON blob during debugging. Group ids
// are opaque strings — nothing else in the codebase relies on their format.
function mintGroupId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

// Compute the display letter (A / B / C / ...) for an exercise inside its
// superset run. Solo exercises (no supersetGroupId, or a run of length 1)
// return null so the row renders in its regular unlettered style.
function supersetLetterFor(exercises: ProgramExercise[], idx: number): string | null {
  const gid = exercises[idx]?.supersetGroupId
  if (!gid) return null
  // Walk backwards to find the head of the run.
  let head = idx
  while (head > 0 && exercises[head - 1]?.supersetGroupId === gid) head--
  // Walk forwards to check the group is at least 2 exercises.
  let tail = idx
  while (tail < exercises.length - 1 && exercises[tail + 1]?.supersetGroupId === gid) tail++
  if (tail === head) return null
  const offset = idx - head
  return String.fromCharCode("A".charCodeAt(0) + offset)
}

function isSupersetHeadFor(exercises: ProgramExercise[], idx: number): boolean {
  const gid = exercises[idx]?.supersetGroupId
  if (!gid) return false
  const prev = exercises[idx - 1]?.supersetGroupId
  const next = exercises[idx + 1]?.supersetGroupId
  return prev !== gid && next === gid
}

function isSupersetTailFor(exercises: ProgramExercise[], idx: number): boolean {
  const gid = exercises[idx]?.supersetGroupId
  if (!gid) return false
  const prev = exercises[idx - 1]?.supersetGroupId
  const next = exercises[idx + 1]?.supersetGroupId
  return prev === gid && next !== gid
}

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

  // Toggle whether row i and row i+1 belong to the same superset group.
  //   Pair: adopt any existing group id on either row; otherwise mint one.
  //         Chaining onto an already-grouped row extends the run, which is
  //         how 3+ exercise supersets get formed one link at a time.
  //   Unpair: only strip the group id from the two rows the coach clicked
  //         between — anything above/below that still shares the id stays
  //         grouped. This keeps the button behavior local and predictable.
  function toggleSupersetWithNext(i: number) {
    if (i >= exercises.length - 1) return
    const cur = exercises[i]
    const nxt = exercises[i + 1]
    const paired = !!cur.supersetGroupId && cur.supersetGroupId === nxt.supersetGroupId
    const next = [...exercises]
    if (paired) {
      next[i] = { ...cur, supersetGroupId: undefined }
      next[i + 1] = { ...nxt, supersetGroupId: undefined }
    } else {
      const gid = cur.supersetGroupId ?? nxt.supersetGroupId ?? mintGroupId()
      next[i] = { ...cur, supersetGroupId: gid }
      next[i + 1] = { ...nxt, supersetGroupId: gid }
    }
    onChange(next)
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
          {exercises.map((ex, i) => {
            const nextEx = exercises[i + 1]
            const isPairedWithNext = !!ex.supersetGroupId && !!nextEx && ex.supersetGroupId === nextEx.supersetGroupId
            return (
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
                supersetLetter={supersetLetterFor(exercises, i)}
                isSupersetHead={isSupersetHeadFor(exercises, i)}
                isSupersetTail={isSupersetTailFor(exercises, i)}
                onToggleSupersetWithNext={() => toggleSupersetWithNext(i)}
                canToggleSupersetWithNext={i < exercises.length - 1}
                isPairedWithNext={isPairedWithNext}
              />
            )
          })}
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
