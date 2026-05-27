"use client"
import { useTracker } from "./TrackerContext"

const gold = "#c9a96e"
const muted = "#555"

export function WeekNav() {
  const { data, setCurrentWeekIndex, addWeek } = useTracker()
  const { weeks, currentWeekIndex } = data
  const total = weeks.length
  const current = currentWeekIndex + 1
  const isFirst = currentWeekIndex === 0
  const isLast = currentWeekIndex === total - 1

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d" }}>
      <button
        onClick={() => setCurrentWeekIndex(currentWeekIndex - 1)}
        disabled={isFirst}
        style={{ background: "none", border: "none", color: isFirst ? "#2a2a2a" : gold, cursor: isFirst ? "default" : "pointer", padding: "4px 8px", fontSize: 22, lineHeight: 1 }}
        aria-label="Previous week"
      >
        ‹
      </button>

      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em", color: "#f0e6d3", textTransform: "uppercase" }}>
        Week {current} <span style={{ color: muted, fontWeight: 400 }}>of {total}</span>
      </span>

      {isLast ? (
        <button
          onClick={addWeek}
          style={{ background: "none", border: "1px solid #2a2a2a", color: muted, cursor: "pointer", padding: "5px 12px", fontSize: "0.55rem", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}
        >
          + Week
        </button>
      ) : (
        <button
          onClick={() => setCurrentWeekIndex(currentWeekIndex + 1)}
          style={{ background: "none", border: "none", color: gold, cursor: "pointer", padding: "4px 8px", fontSize: 22, lineHeight: 1 }}
          aria-label="Next week"
        >
          ›
        </button>
      )}
    </div>
  )
}
