"use client"
import { useState, useMemo } from "react"
import { useTracker } from "./TrackerContext"
import { ExerciseTableRow } from "./ExerciseTableRow"
import { TrackerExercise } from "@/lib/trackerStorage"

const gold = "#c9a96e"

const TYPE_OPTIONS: { value: TrackerExercise["type"]; label: string }[] = [
  { value: "weight_reps", label: "Weight + Reps" },
  { value: "reps_only", label: "Reps Only" },
  { value: "time", label: "Time" },
  { value: "weight_time", label: "Weight + Time" },
]

interface ExerciseTableProps {
  dayId: string
}

export function ExerciseTable({ dayId }: ExerciseTableProps) {
  const { data, addExercise } = useTracker()
  const [input, setInput] = useState("")
  const [type, setType] = useState<TrackerExercise["type"]>("weight_reps")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const day = data.days.find((d) => d.id === dayId)
  const currentWeek = data.weeks[data.currentWeekIndex]
  const prevWeek = data.currentWeekIndex > 0 ? data.weeks[data.currentWeekIndex - 1] : null
  const currentLog = currentWeek?.logs[dayId]
  const prevLog = prevWeek?.logs[dayId]

  const suggestions = useMemo(() => {
    if (!input.trim()) return []
    const allNames = [...new Set(data.days.flatMap((d) => d.exercises.map((e) => e.name)))]
    return allNames
      .filter((n) => n.toLowerCase().includes(input.toLowerCase()) && n !== input)
      .slice(0, 6)
  }, [data.days, input])

  const handleAdd = (name?: string) => {
    const finalName = (name ?? input).trim()
    if (!finalName) return
    addExercise(dayId, finalName, type)
    setInput("")
    setShowSuggestions(false)
  }

  if (!day || !currentWeek) return null

  const sorted = [...day.exercises].sort((a, b) => a.order - b.order)

  return (
    <div>
      {sorted.length === 0 && (
        <div style={{ padding: "36px 16px 12px", textAlign: "center", color: "#2a2a2a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.08em" }}>
          Add your first exercise below
        </div>
      )}

      {sorted.map((exercise) => {
        const loggedSets = (currentLog?.sets ?? []).filter((s) => s.exerciseId === exercise.id)
        const prevSets = (prevLog?.sets ?? []).filter((s) => s.exerciseId === exercise.id)
        return (
          <ExerciseTableRow
            key={`${exercise.id}-${currentWeek.id}`}
            exercise={exercise}
            dayId={dayId}
            weekId={currentWeek.id}
            loggedSets={loggedSets}
            prevSets={prevSets}
            weightUnit={data.weightUnit}
          />
        )
      })}

      {/* Add exercise row */}
      <div style={{ padding: "14px 16px 20px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch", position: "relative" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              placeholder="+ Add exercise"
              value={input}
              onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
              style={{
                width: "100%",
                background: "#0d0d0d",
                border: "1px solid #1e1e1e",
                color: "#555",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: 14,
                padding: "10px 12px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "#161616", border: "1px solid #2a2a2a", borderTop: "none" }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => handleAdd(s)}
                    style={{
                      display: "block",
                      width: "100%",
                      background: "none",
                      border: "none",
                      borderBottom: "1px solid #1a1a1a",
                      color: "#aaa",
                      fontFamily: "var(--font-montserrat), sans-serif",
                      fontSize: "0.65rem",
                      padding: "9px 12px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as TrackerExercise["type"])}
            style={{
              background: "#161616",
              border: "1px solid #1e1e1e",
              color: "#555",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.55rem",
              padding: "8px 6px",
              outline: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => handleAdd()}
            style={{
              background: gold,
              border: "none",
              color: "#0a0a0a",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.55rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "10px 14px",
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
