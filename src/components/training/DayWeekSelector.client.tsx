"use client"

import { useCourseProgress } from "./CourseProgressContext"
import { useDayLogs } from "./DayLogsContext"

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#888"
const border = "#2a2a2a"

export default function DayWeekSelector() {
  const { currentPosition } = useCourseProgress()
  const {
    selectedRound, selectedWeek,
    setSelectedRound, setSelectedWeek, setEditing,
    weekOptions, addWeek, weeksPerRound, isControlled,
  } = useDayLogs()

  if (isControlled) return null

  const activeIdx = weekOptions.findIndex((o) => o.active)
  const prevOpt = activeIdx > 0 ? weekOptions[activeIdx - 1] : null
  const nextOpt = activeIdx < weekOptions.length - 1 ? weekOptions[activeIdx + 1] : null

  const isOnCurrentWeek =
    selectedRound === currentPosition.round && selectedWeek === currentPosition.week

  function goTo(opt: { round: number; week: number }) {
    setSelectedRound(opt.round)
    setSelectedWeek(opt.week)
    setEditing(false)
  }

  const weekLabel =
    selectedRound === 1
      ? `Week ${selectedWeek} of ${weeksPerRound}`
      : `Round ${selectedRound} · Week ${selectedWeek}`

  const arrowBtn = (enabled: boolean): React.CSSProperties => ({
    background: "none",
    border: `1px solid ${border}`,
    color: enabled ? cream : "#333",
    cursor: enabled ? "pointer" : "default",
    fontSize: "0.75rem",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
    flexShrink: 0,
  })

  return (
    <div style={{ marginBottom: 20, padding: "12px 14px", background: "#0c0c0c", border: `1px solid ${border}` }}>
      {/* Tier 1 — arrow nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <button
          onClick={() => prevOpt && goTo(prevOpt)}
          disabled={!prevOpt}
          style={arrowBtn(!!prevOpt)}
          title="Previous week"
        >
          ←
        </button>

        <span
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: cream,
            minWidth: 130,
            textAlign: "center",
          }}
        >
          {weekLabel}
        </span>

        <button
          onClick={() => nextOpt && goTo(nextOpt)}
          disabled={!nextOpt}
          style={arrowBtn(!!nextOpt)}
          title="Next week"
        >
          →
        </button>

        <button
          onClick={addWeek}
          title="Add a week"
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.08em",
            padding: "5px 8px",
            border: `1px dashed ${border}`,
            background: "transparent",
            color: muted,
            cursor: "pointer",
            marginLeft: 4,
          }}
        >
          + wk
        </button>
      </div>

      {/* Back-to-current link */}
      {!isOnCurrentWeek && (
        <button
          onClick={() => {
            setSelectedRound(currentPosition.round)
            setSelectedWeek(currentPosition.week)
            setEditing(false)
          }}
          style={{
            background: "none",
            border: "none",
            color: muted,
            fontSize: "0.55rem",
            fontFamily: "var(--font-montserrat), sans-serif",
            letterSpacing: "0.08em",
            cursor: "pointer",
            padding: "0 0 6px",
            textDecoration: "underline",
            display: "block",
          }}
        >
          ← Back to current week
        </button>
      )}

      {/* Tier 2 — quick-jump pills */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {weekOptions.map((opt) => (
          <button
            key={`${opt.round}-${opt.week}`}
            onClick={() => goTo(opt)}
            style={{
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.08em",
              padding: "5px 9px",
              border: opt.active ? `1px solid ${gold}` : `1px solid ${border}`,
              background: opt.active ? "rgba(201,169,110,0.12)" : "transparent",
              color: opt.active ? gold : opt.done ? "#aaa" : muted,
              cursor: "pointer",
              position: "relative",
            }}
            title={opt.label}
          >
            {opt.label}
            {opt.done && (
              <span style={{ position: "absolute", top: 1, right: 2, fontSize: "0.4rem", color: gold }}>
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
