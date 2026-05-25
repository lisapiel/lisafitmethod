"use client"

import { useState, useEffect } from "react"
import { useCourseProgress } from "@/components/training/CourseProgressContext"
import { DayLogsProvider } from "@/components/training/DayLogsContext"
import DayWorkoutPanel from "@/components/training/DayWorkoutPanel.client"
import { WORKOUT_DAYS } from "@/lib/workoutData"

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#888"
const border = "#2a2a2a"

type DayKey = "a" | "b" | "c"
const DAYS: DayKey[] = ["a", "b", "c"]

export default function WeeklyLogClient() {
  const { ready, progress, currentPosition, getSessionFor, addWeek } = useCourseProgress()

  const weeksPerRound = progress.weeksPerRound ?? 6

  const [round, setRound] = useState(1)
  const [week, setWeek] = useState(1)

  // Initialize to next incomplete position
  useEffect(() => {
    if (!ready) return
    const pos = currentPosition
    for (let r = pos.round; r <= pos.round + 1; r++) {
      for (let w = 1; w <= weeksPerRound; w++) {
        const anyIncomplete = DAYS.some((d) => !getSessionFor(r, w, d))
        if (anyIncomplete) {
          setRound(r)
          setWeek(w)
          return
        }
      }
    }
    setRound(pos.round)
    setWeek(pos.week)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  if (!ready) {
    return (
      <div style={{ padding: "80px 40px", textAlign: "center", color: muted, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem" }}>
        Loading…
      </div>
    )
  }

  // Build week options
  const maxRound = Math.max(currentPosition.round, round)
  type WeekOpt = { round: number; week: number; label: string; done: boolean; active: boolean }
  const weekOptions: WeekOpt[] = []
  for (let r = 1; r <= maxRound; r++) {
    for (let w = 1; w <= weeksPerRound; w++) {
      const allDone = DAYS.every((d) => !!getSessionFor(r, w, d))
      weekOptions.push({
        round: r,
        week: w,
        label: `Week ${(r - 1) * weeksPerRound + w}`,
        done: allDone,
        active: r === round && w === week,
      })
    }
  }

  const activeIdx = weekOptions.findIndex((o) => o.active)
  const prevOpt = activeIdx > 0 ? weekOptions[activeIdx - 1] : null
  const nextOpt = activeIdx < weekOptions.length - 1 ? weekOptions[activeIdx + 1] : null
  const isOnCurrentWeek = round === currentPosition.round && week === currentPosition.week

  function goTo(opt: WeekOpt) {
    setRound(opt.round)
    setWeek(opt.week)
  }

  const totalWeek = (round - 1) * weeksPerRound + week
  const weekLabel = `Week ${totalWeek}`

  const arrowBtn = (enabled: boolean): React.CSSProperties => ({
    background: "none",
    border: `1px solid ${border}`,
    color: enabled ? cream : "#333",
    cursor: enabled ? "pointer" : "default",
    fontSize: "0.75rem",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
    flexShrink: 0,
  })

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 32px 80px", fontFamily: "var(--font-montserrat), sans-serif" }}>

      {/* Page title */}
      <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 12 }}>
        Training Foundations
      </p>
      <h1 style={{ fontFamily: "var(--font-cormorant, var(--font-montserrat)), serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: cream, marginBottom: 8, lineHeight: 1.15 }}>
        Weekly Log
      </h1>
      <p style={{ fontSize: "0.75rem", color: muted, marginBottom: 32, lineHeight: 1.3 }}>
        Log all three days for the selected week. Pick any week to review or update what you lifted.
      </p>

      {/* Week selector */}
      <div style={{ marginBottom: 36, paddingBottom: 28, borderBottom: `1px solid ${border}` }}>
        {/* Tier 1 — arrow nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
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
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: cream,
              minWidth: 160,
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
              padding: "6px 10px",
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
              setRound(currentPosition.round)
              setWeek(currentPosition.week)
            }}
            style={{
              background: "none",
              border: "none",
              color: muted,
              fontSize: "0.55rem",
              fontFamily: "var(--font-montserrat), sans-serif",
              letterSpacing: "0.08em",
              cursor: "pointer",
              padding: "0 0 8px",
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

      {/* Day panels */}
      {DAYS.map((day) => {
        const dayDef = WORKOUT_DAYS[day]
        const daySession = getSessionFor(round, week, day)
        return (
          <div key={day} style={{ marginBottom: 48 }}>
            {/* Day header */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
              <span
                style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: daySession ? gold : cream,
                }}
              >
                {dayDef.label}
              </span>
              {daySession && (
                <span style={{ fontSize: "0.55rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em" }}>
                  ✓ Logged {new Date(daySession.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <div style={{ height: 1, background: border, marginBottom: 0 }} />

            <DayLogsProvider day={day} controlledRound={round} controlledWeek={week}>
              <DayWorkoutPanel day={day} />
            </DayLogsProvider>
          </div>
        )
      })}
    </div>
  )
}
