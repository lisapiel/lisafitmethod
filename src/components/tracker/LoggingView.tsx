"use client"
import { useTracker } from "./TrackerContext"
import { WeekSelectorBar } from "./WeekSelectorBar"
import { ExerciseLogBlock } from "./ExerciseLogBlock"
import { SetLog } from "@/lib/trackerStorage"

interface LoggingViewProps {
  dayId: string
  onBack: () => void
}

export function LoggingView({ dayId, onBack }: LoggingViewProps) {
  const { data, addSet, removeSet, markDayComplete } = useTracker()

  const day = data.days.find((d) => d.id === dayId)
  const currentWeek = data.weeks[data.currentWeekIndex]
  const prevWeek = data.currentWeekIndex > 0 ? data.weeks[data.currentWeekIndex - 1] : undefined

  if (!day || !currentWeek) return null

  const currentLog = currentWeek.logs[dayId]
  const prevLog = prevWeek?.logs[dayId]
  const isCompleted = !!currentLog?.completedAt

  const sortedExercises = [...day.exercises].sort((a, b) => a.order - b.order)

  const handleAddSet = (exerciseId: string, values: { weight?: number; reps?: number; minutes?: number; seconds?: number }) => {
    const set: Omit<SetLog, "setNumber"> = {
      exerciseId,
      unit: data.weightUnit,
      ...values,
    }
    addSet(currentWeek.id, dayId, set)
  }

  const handleRemoveSet = (exerciseId: string, setIndex: number) => {
    removeSet(currentWeek.id, dayId, exerciseId, setIndex)
  }

  const handleMarkComplete = () => {
    markDayComplete(currentWeek.id, dayId)
  }

  const totalSets = (currentLog?.sets ?? []).length

  return (
    <>
      <WeekSelectorBar />

      <div style={{ padding: "16px 16px 100px" }}>
        {/* Day title */}
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #1a1a1a" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 26, fontWeight: 400, color: "#f0e6d3", lineHeight: 1.2 }}>
            {day.name}
          </p>
          {isCompleted && (
            <p style={{ fontSize: 10, color: "#c9a96e", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>
              ✓ Completed
            </p>
          )}
        </div>

        {/* Exercises */}
        {sortedExercises.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#555", fontSize: 13 }}>
            No exercises in this day yet. Go back and manage the day to add some.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortedExercises.map((exercise) => (
              <ExerciseLogBlock
                key={exercise.id}
                exercise={exercise}
                currentLog={currentLog}
                prevLog={prevLog}
                weightUnit={data.weightUnit}
                onAddSet={(values) => handleAddSet(exercise.id, values)}
                onRemoveSet={(setIndex) => handleRemoveSet(exercise.id, setIndex)}
              />
            ))}
          </div>
        )}

        {/* Done button */}
        {sortedExercises.length > 0 && !isCompleted && totalSets > 0 && (
          <button
            onClick={handleMarkComplete}
            style={{
              marginTop: 20,
              width: "100%",
              background: "#c9a96e",
              border: "none",
              color: "#0a0a0a",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "16px 20px",
              cursor: "pointer",
            }}
          >
            Done for Today ✓
          </button>
        )}

        {isCompleted && (
          <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.15)", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#c9a96e", letterSpacing: "0.1em" }}>
              This session is logged. Edit sets above if needed.
            </p>
          </div>
        )}

        <button
          onClick={onBack}
          style={{ marginTop: 16, width: "100%", background: "none", border: "1px solid #1e1e1e", color: "#444", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer" }}
        >
          ← Back to Days
        </button>
      </div>
    </>
  )
}
