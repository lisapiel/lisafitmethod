"use client"
import { useTracker } from "./TrackerContext"

export function WeekSelectorBar() {
  const { data, setCurrentWeekIndex, addWeek } = useTracker()
  const { weeks, currentWeekIndex } = data
  const current = weeks[currentWeekIndex]

  if (!current) return null

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      borderBottom: "1px solid #161616",
      background: "#0d0d0d",
      flexShrink: 0,
    }}>
      <button
        onClick={() => setCurrentWeekIndex(currentWeekIndex - 1)}
        disabled={currentWeekIndex === 0}
        style={{ background: "none", border: "none", color: currentWeekIndex === 0 ? "#333" : "#c9a96e", cursor: currentWeekIndex === 0 ? "default" : "pointer", padding: "4px 8px", fontSize: 16, lineHeight: 1 }}
        aria-label="Previous week"
      >
        ‹
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0e6d3" }}>
          Week {current.number}
        </span>
        <span style={{ fontSize: 10, color: "#444", letterSpacing: "0.05em" }}>
          of {weeks.length}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {currentWeekIndex < weeks.length - 1 && (
          <button
            onClick={() => setCurrentWeekIndex(currentWeekIndex + 1)}
            style={{ background: "none", border: "none", color: "#c9a96e", cursor: "pointer", padding: "4px 8px", fontSize: 16, lineHeight: 1 }}
            aria-label="Next week"
          >
            ›
          </button>
        )}
        {currentWeekIndex === weeks.length - 1 && (
          <button
            onClick={addWeek}
            style={{
              background: "none",
              border: "1px solid #2a2a2a",
              color: "#666",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            + Week
          </button>
        )}
      </div>
    </div>
  )
}
