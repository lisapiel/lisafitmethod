"use client"

import { useState } from "react"
import Link from "next/link"
import { useCourseProgress } from "./CourseProgressContext"
import { WorkoutSession, getSessionsForRound } from "@/lib/courseProgress"
import { WORKOUT_DAYS } from "@/lib/workoutData"
import { TrackerUpsellBanner } from "./TrackerUpsellBanner"

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#888"
const border = "#2a2a2a"
const cardBg = "#161616"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function dayLabel(day: "a" | "b" | "c") {
  return day === "a" ? "Day A" : day === "b" ? "Day B" : "Day C"
}

function CalendarGrid({ sessions, round, weeksPerRound }: { sessions: WorkoutSession[]; round: number; weeksPerRound: number }) {
  const roundSessions = getSessionsForRound(sessions, round)

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", gap: 4 }}>
        {/* Header */}
        <div />
        {(["a", "b", "c"] as const).map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.55rem", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.15em", color: muted, textTransform: "uppercase", paddingBottom: 8 }}>
            {d === "a" ? "Lower" : d === "b" ? "Upper" : "Integr."}
          </div>
        ))}

        {/* Rows */}
        {Array.from({ length: weeksPerRound }, (_, i) => i + 1).map((week) => (
          <>
            <div key={`w${week}-label`} style={{ display: "flex", alignItems: "center", fontSize: "0.6rem", fontFamily: "var(--font-montserrat), sans-serif", color: muted, letterSpacing: "0.05em" }}>
              Week {week}
            </div>
            {(["a", "b", "c"] as const).map((d) => {
              const sess = roundSessions.find((s) => s.week === week && s.day === d)
              return (
                <div
                  key={`${week}-${d}`}
                  title={sess ? `Completed ${formatShortDate(sess.completedAt)}` : "Not done yet"}
                  style={{
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: sess ? `1px solid ${gold}` : `1px solid ${border}`,
                    background: sess ? "rgba(201,169,110,0.1)" : "transparent",
                    borderRadius: 2,
                  }}
                >
                  {sess ? (
                    <span style={{ color: gold, fontSize: "0.8rem" }}>✓</span>
                  ) : (
                    <span style={{ color: "#333", fontSize: "0.7rem" }}>○</span>
                  )}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}

function PRsTable() {
  const { prs, progress } = useCourseProgress()
  const entries = Object.entries(prs)
  if (entries.length === 0) return null

  // Get all exercise defs for name lookup
  const allExercises = [
    ...WORKOUT_DAYS.a.exercises,
    ...WORKOUT_DAYS.b.exercises,
    ...WORKOUT_DAYS.c.exercises,
  ]

  // Get first logged weight per exercise for delta
  const firstWeights: Record<string, number> = {}
  for (const session of [...progress.sessions].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  )) {
    for (const ex of session.exercises) {
      if (!(ex.exerciseId in firstWeights)) {
        const w = ex.sets.find((s) => s.weight > 0)
        if (w) firstWeights[ex.exerciseId] = w.weight
      }
    }
  }

  return (
    <div style={{ marginBottom: 40 }}>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: 16 }}>
        Personal Records
      </p>
      <div style={{ border: `1px solid ${border}`, background: cardBg }}>
        {entries.map(([id, set], i) => {
          const def = allExercises.find((e) => e.id === id)
          const first = firstWeights[id]
          const delta = first && set.weight > first ? set.weight - first : null
          return (
            <div
              key={id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 12,
                padding: "10px 16px",
                borderTop: i > 0 ? `1px solid ${border}` : "none",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.65rem", color: cream, fontFamily: "var(--font-montserrat), sans-serif" }}>
                {def?.name ?? id}
              </span>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: gold, fontFamily: "var(--font-montserrat), sans-serif" }}>
                {set.weight} {set.unit}
              </span>
              {delta !== null ? (
                <span style={{ fontSize: "0.6rem", color: "#6abf6a", fontFamily: "var(--font-montserrat), sans-serif" }}>
                  +{delta} {set.unit}
                </span>
              ) : (
                <span />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SessionHistory() {
  const { progress } = useCourseProgress()
  const [expanded, setExpanded] = useState<string | null>(null)

  const sorted = [...progress.sessions].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )

  if (sorted.length === 0) return null

  const allExercises = [
    ...WORKOUT_DAYS.a.exercises,
    ...WORKOUT_DAYS.b.exercises,
    ...WORKOUT_DAYS.c.exercises,
  ]

  return (
    <div>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: 16 }}>
        Session History
      </p>
      {sorted.map((s) => {
        const isExpanded = expanded === s.id
        const dayDef = WORKOUT_DAYS[s.day]
        return (
          <div
            key={s.id}
            style={{ border: `1px solid ${border}`, marginBottom: 8, background: cardBg }}
          >
            <button
              onClick={() => setExpanded(isExpanded ? null : s.id)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div>
                <span style={{ fontSize: "0.7rem", color: cream, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 500 }}>
                  {dayLabel(s.day)} — {dayDef.label.replace(/^Day [ABC]: /, "")}
                </span>
                <span style={{ display: "block", fontSize: "0.6rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", marginTop: 2 }}>
                  Round {s.round} · Week {s.week} · {formatDate(s.completedAt)}
                </span>
              </div>
              <span style={{ color: muted, fontSize: "0.7rem", flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</span>
            </button>

            {isExpanded && (
              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${border}` }}>
                {s.exercises.map((ex) => {
                  const def = allExercises.find((e) => e.id === ex.exerciseId)
                  return (
                    <div key={ex.exerciseId} style={{ marginTop: 10 }}>
                      <span style={{ fontSize: "0.65rem", color: "#aaa", fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 500 }}>
                        {def?.name ?? ex.exerciseId}
                      </span>
                      <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {ex.sets.map((set, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: "0.6rem",
                              color: muted,
                              fontFamily: "var(--font-montserrat), sans-serif",
                              background: "#1e1e1e",
                              padding: "3px 8px",
                              borderRadius: 3,
                            }}
                          >
                            {set.reps > 0 ? `${set.reps} reps` : "—"}
                            {set.weight > 0 ? ` · ${set.weight}${set.unit}` : def?.bodyweight ? " · BW" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ProgressTracker() {
  const { ready, progress, currentPosition } = useCourseProgress()
  const [activeRound, setActiveRound] = useState(1)

  if (!ready) {
    return (
      <div style={{ padding: "80px 40px", textAlign: "center", color: muted, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem" }}>
        Loading…
      </div>
    )
  }

  const weeksPerRound = progress.weeksPerRound ?? 6
  const { round, week, totalSessions, startedAt } = currentPosition
  const sessionsInRound = getSessionsForRound(progress.sessions, round).length
  const totalInRound = weeksPerRound * 3
  const pct = Math.round((sessionsInRound / totalInRound) * 100)

  const maxRound = Math.max(...progress.sessions.map((s) => s.round), 1)
  const roundOptions = Array.from({ length: maxRound }, (_, i) => i + 1)

  const roundComplete = sessionsInRound === totalInRound

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 32px 80px", fontFamily: "var(--font-montserrat), sans-serif" }}>

      {/* Title */}
      <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 12 }}>
        Training Foundations
      </p>
      <h1 style={{ fontFamily: "var(--font-cormorant, var(--font-montserrat)), serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: cream, marginBottom: 32, lineHeight: 1.15 }}>
        My Training Log
      </h1>

      {totalSessions === 0 ? (
        <div style={{ border: `1px solid ${border}`, background: cardBg, padding: "40px 32px", textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: "0.8rem", color: cream, marginBottom: 8 }}>No sessions logged yet.</p>
          <p style={{ fontSize: "0.7rem", color: muted, marginBottom: 24 }}>Head to Module 3 to start the program and log your first workout.</p>
          <Link
            href="/training-foundations/module3"
            style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "12px 28px", textDecoration: "none", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}
          >
            Go to The Program →
          </Link>
        </div>
      ) : (
        <>
          {/* Status bar */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 32, padding: "20px 24px", border: `1px solid ${border}`, background: cardBg }}>
            <div>
              <p style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: muted, textTransform: "uppercase", marginBottom: 4 }}>Status</p>
              <p style={{ fontSize: "0.75rem", color: cream, fontWeight: 500 }}>Round {round} · Week {week}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: muted, textTransform: "uppercase", marginBottom: 4 }}>Total sessions</p>
              <p style={{ fontSize: "0.75rem", color: cream, fontWeight: 500 }}>{totalSessions}</p>
            </div>
            {startedAt && (
              <div>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: muted, textTransform: "uppercase", marginBottom: 4 }}>Started</p>
                <p style={{ fontSize: "0.75rem", color: cream, fontWeight: 500 }}>{formatShortDate(startedAt)}</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: muted, textTransform: "uppercase", marginBottom: 4 }}>This round</p>
              <p style={{ fontSize: "0.75rem", color: cream, fontWeight: 500 }}>{sessionsInRound} / {totalInRound}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.6rem", color: muted, letterSpacing: "0.1em" }}>Round {round} progress</span>
              <span style={{ fontSize: "0.6rem", color: roundComplete ? gold : muted }}>{pct}%{roundComplete ? " — Complete! 🎉" : ""}</span>
            </div>
            <div style={{ height: 4, background: border, borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: gold, borderRadius: 2, transition: "width 0.4s ease" }} />
            </div>
          </div>

          {roundComplete && (
            <div style={{ border: `1px solid ${gold}`, background: "rgba(201,169,110,0.06)", padding: "24px 24px", marginBottom: 40 }}>
              <p style={{ fontSize: "0.75rem", color: cream, fontWeight: 500, marginBottom: 8 }}>
                Round {round} complete. You put in the work.
              </p>
              <p style={{ fontSize: "0.65rem", color: muted, marginBottom: 16, lineHeight: 1.6 }}>
                The program works by repeating it — each round you go heavier, move better, and build more. Round {round + 1} starts now.
              </p>
              <Link
                href="/training-foundations/module3"
                style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "12px 24px", textDecoration: "none", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}
              >
                Start Round {round + 1} →
              </Link>
            </div>
          )}

          {/* Round tabs */}
          {roundOptions.length > 1 && (
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {roundOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRound(r)}
                  style={{
                    padding: "7px 14px",
                    border: activeRound === r ? `1px solid ${gold}` : `1px solid ${border}`,
                    background: activeRound === r ? "rgba(201,169,110,0.1)" : "transparent",
                    color: activeRound === r ? gold : muted,
                    fontSize: "0.6rem",
                    letterSpacing: "0.1em",
                    fontFamily: "var(--font-montserrat), sans-serif",
                    cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  Round {r}
                </button>
              ))}
            </div>
          )}

          {/* Calendar */}
          <CalendarGrid sessions={progress.sessions} round={activeRound} weeksPerRound={weeksPerRound} />

          {/* PRs */}
          <PRsTable />

          {/* History */}
          <SessionHistory />

          <TrackerUpsellBanner />
        </>
      )}
    </div>
  )
}
