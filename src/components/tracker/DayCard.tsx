"use client"
import { WorkoutDay } from "@/lib/trackerStorage"

interface DayCardProps {
  day: WorkoutDay
  isCompleted: boolean
  onLog: () => void
  onManage: () => void
}

export function DayCard({ day, isCompleted, onLog, onManage }: DayCardProps) {
  return (
    <div style={{
      background: "#111111",
      border: "1px solid #1e1e1e",
      padding: "18px 18px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 20, fontWeight: 500, color: "#f0e6d3", marginBottom: 2, lineHeight: 1.2 }}>
            {day.name}
          </p>
          <p style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em" }}>
            {day.exercises.length === 0
              ? "No exercises yet"
              : `${day.exercises.length} exercise${day.exercises.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isCompleted && (
            <span style={{ fontSize: 11, color: "#c9a96e", letterSpacing: "0.05em" }}>✓</span>
          )}
          <button
            onClick={onManage}
            style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
            aria-label={`Manage ${day.name}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2.2" stroke="#444" strokeWidth="1.2" />
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06" stroke="#444" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {day.exercises.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {day.exercises.slice(0, 4).map((ex) => (
            <span key={ex.id} style={{
              fontSize: 9,
              color: "#555",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "#161616",
              padding: "3px 8px",
              border: "1px solid #222",
            }}>
              {ex.name}
            </span>
          ))}
          {day.exercises.length > 4 && (
            <span style={{ fontSize: 9, color: "#444", letterSpacing: "0.05em", padding: "3px 0" }}>
              +{day.exercises.length - 4} more
            </span>
          )}
        </div>
      )}

      <button
        onClick={onLog}
        style={{
          background: isCompleted ? "transparent" : "#c9a96e",
          border: isCompleted ? "1px solid #2a2a2a" : "none",
          color: isCompleted ? "#555" : "#0a0a0a",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          padding: "12px 20px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {isCompleted ? "View / Edit Log" : day.exercises.length === 0 ? "Add Exercises First" : "Log Workout"}
      </button>
    </div>
  )
}
