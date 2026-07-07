"use client"

import { useState } from "react"
import ExerciseSearchModal from "./ExerciseSearchModal"
import type { SearchExercise } from "./ExerciseSearchModal"
import type { ProgramExercise } from "./ExerciseRow"

const gold = "#c9a96e"
const border = "#2a2a2a"
const CDN = process.env.NEXT_PUBLIC_AMBRISA_CDN_URL ?? ""

function cdnThumb(key: string | null | undefined) {
  if (!key) return ""
  return `${CDN}/${encodeURIComponent(key.replace(/\.mp4$/i, ".jpg"))}`
}

function DrillRow({
  ex, onUpdate, onRemove, onReplace, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
}: {
  ex: ProgramExercise
  onUpdate: (u: ProgramExercise) => void
  onRemove: () => void
  onReplace: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const metric = ex.metric ?? "reps"

  return (
    <div style={{ background: "#0f0f0f", border: `1px solid ${border}`, padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
          <button onClick={onMoveUp} disabled={!canMoveUp} style={{ background: "none", border: "none", color: canMoveUp ? "#888" : "#333", cursor: canMoveUp ? "pointer" : "not-allowed", padding: "0 4px", fontSize: "0.7rem", lineHeight: 1 }}>▲</button>
          <button onClick={onMoveDown} disabled={!canMoveDown} style={{ background: "none", border: "none", color: canMoveDown ? "#888" : "#333", cursor: canMoveDown ? "pointer" : "not-allowed", padding: "0 4px", fontSize: "0.7rem", lineHeight: 1 }}>▼</button>
        </div>
        <div style={{ width: 36, height: 36, flexShrink: 0 }}>
          {ex.videoS3Key && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={cdnThumb(ex.videoS3Key)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#f0e6d3", flex: 1 }}>{ex.name}</span>
        <button onClick={onReplace} style={{ background: "none", border: `1px solid ${border}`, color: gold, cursor: "pointer", padding: "4px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Replace
        </button>
        <button onClick={onRemove} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "4px 8px", fontSize: "0.8rem", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
        {/* Metric toggle */}
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>Track by</div>
          <div style={{ display: "inline-flex", border: `1px solid ${border}` }}>
            {(["reps", "time"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onUpdate({ ...ex, metric: m })}
                style={{
                  background: metric === m ? gold : "transparent",
                  color: metric === m ? "#0a0a0a" : "#888",
                  border: "none",
                  padding: "5px 12px",
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: metric === m ? 700 : 400,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {m === "reps" ? "Reps" : "Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Value input */}
        <div style={{ minWidth: 100 }}>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {metric === "reps" ? "Reps" : "Duration"}
          </div>
          <input
            type="text"
            value={ex.reps}
            onChange={(e) => onUpdate({ ...ex, reps: e.target.value })}
            placeholder={metric === "reps" ? "10-12" : "30s"}
            style={{ background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "6px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", width: 90, boxSizing: "border-box" }}
          />
        </div>

        {/* Coach notes */}
        <div style={{ flex: "1 1 200px", minWidth: 160 }}>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>Coach Notes (optional)</div>
          <input
            type="text"
            value={ex.coachNotes}
            onChange={(e) => onUpdate({ ...ex, coachNotes: e.target.value })}
            placeholder="e.g. Focus on hip mobility"
            style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "6px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>
    </div>
  )
}

function emptyDrill(ex: SearchExercise): ProgramExercise {
  return {
    exerciseId: ex.id,
    name: ex.name,
    videoS3Key: ex.videoS3Key ?? "",
    sets: "",
    reps: "10",
    weight: "",
    rpe: "",
    rest: "",
    tempo: "",
    coachNotes: "",
    metric: "reps",
  }
}

export default function WarmupCooldownBuilder({ exercises, onChange }: {
  exercises: ProgramExercise[]
  onChange: (next: ProgramExercise[]) => void
}) {
  const [showSearch, setShowSearch] = useState(false)
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null)

  function addDrill(ex: SearchExercise) {
    onChange([...exercises, emptyDrill(ex)])
  }

  function updateDrill(idx: number, updated: ProgramExercise) {
    onChange(exercises.map((e, i) => i === idx ? updated : e))
  }

  function removeDrill(idx: number) {
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

  function handleSelectFromSearch(ex: SearchExercise) {
    if (replaceIdx !== null) {
      onChange(exercises.map((e, i) => i !== replaceIdx ? e : {
        ...e, exerciseId: ex.id, name: ex.name, videoS3Key: ex.videoS3Key ?? "",
      }))
      setReplaceIdx(null)
    } else {
      addDrill(ex)
    }
  }

  return (
    <>
      {exercises.length === 0 ? (
        <div style={{ background: "#0f0f0f", border: `1px dashed ${border}`, padding: "1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", marginBottom: 12 }}>No drills added yet.</p>
          <button onClick={() => { setReplaceIdx(null); setShowSearch(true) }} style={{ background: gold, color: "#0a0a0a", border: "none", padding: "8px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
            + Add Drill
          </button>
        </div>
      ) : (
        <div>
          {exercises.map((ex, i) => (
            <DrillRow
              key={i}
              ex={ex}
              onUpdate={(u) => updateDrill(i, u)}
              onRemove={() => removeDrill(i)}
              onReplace={() => { setReplaceIdx(i); setShowSearch(true) }}
              onMoveUp={() => moveUp(i)}
              onMoveDown={() => moveDown(i)}
              canMoveUp={i > 0}
              canMoveDown={i < exercises.length - 1}
            />
          ))}
          <button onClick={() => { setReplaceIdx(null); setShowSearch(true) }} style={{ background: "none", border: `1px dashed ${border}`, color: "#555", padding: "8px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", width: "100%", marginTop: 4 }}>
            + Add Drill
          </button>
        </div>
      )}

      {showSearch && (
        <ExerciseSearchModal
          onSelect={handleSelectFromSearch}
          onClose={() => { setShowSearch(false); setReplaceIdx(null) }}
          title={replaceIdx !== null ? "Replace drill" : "Add drill"}
        />
      )}
    </>
  )
}
