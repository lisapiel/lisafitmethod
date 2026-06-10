"use client"

import { useState, useEffect } from "react"
import { fetchUserAttributes } from "aws-amplify/auth"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"
const CDN = process.env.NEXT_PUBLIC_AMBRISA_CDN_URL ?? ""

type ProgramExercise = { exerciseId: string; name: string; videoS3Key: string; sets: string; reps: string; weight: string; rpe: string }
type ProgramDay = { dayLabel: string; notes: string; exercises: ProgramExercise[] }
type ProgramWeek = { weekNumber: number; label: string; days: ProgramDay[] }

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function WorkoutsPage() {
  const [loading, setLoading] = useState(true)
  const [programName, setProgramName] = useState("")
  const [programNotes, setProgramNotes] = useState("")
  const [weeks, setWeeks] = useState<ProgramWeek[]>([])
  const [activeWeek, setActiveWeek] = useState(0)
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set())
  const [noProgram, setNoProgram] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const attrs = await fetchUserAttributes()
        const email = attrs.email ?? ""
        const db = generateClient<Schema>({ authMode: "userPool" })

        const [clientsRes, logsRes] = await Promise.allSettled([
          db.models.CoachingClient.list({ authMode: "userPool" }),
          db.models.CoachingWorkoutLog.list({ authMode: "userPool" }),
        ])

        let programId: string | null = null
        if (clientsRes.status === "fulfilled") {
          const found = clientsRes.value.data.find((c) => c.email.toLowerCase() === email.toLowerCase())
          programId = found?.currentProgramId ?? null
        }

        if (!programId) { setNoProgram(true); setLoading(false); return }

        if (logsRes.status === "fulfilled") {
          const done = new Set(
            logsRes.value.data
              .filter((l) => l.clientEmail.toLowerCase() === email.toLowerCase())
              .map((l) => `${l.weekNumber}::${l.dayLabel}`)
          )
          setCompletedDays(done)
        }

        const { data: prog } = await db.models.CoachingProgram.get({ id: programId })
        if (prog) {
          setProgramName(prog.name)
          setProgramNotes(prog.notes ?? "")
          try { setWeeks(JSON.parse(prog.weeks) as ProgramWeek[]) } catch { /* empty */ }
        }
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spinner />

  if (noProgram) {
    return (
      <div>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, marginBottom: "0.5rem" }}>Workouts</h1>
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "3rem 2rem", textAlign: "center", marginTop: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.3rem", color: muted, marginBottom: 8 }}>No program assigned yet</p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, marginBottom: 20 }}>Lisa is preparing your personalised program.</p>
          <Link href="/my-coaching/messages" style={{ display: "inline-block", background: accent, color: black, padding: "11px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>Message Lisa</Link>
        </div>
      </div>
    )
  }

  const week = weeks[activeWeek]

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, marginBottom: "0.3rem" }}>Your Program</p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, marginBottom: programNotes ? "0.4rem" : 0 }}>{programName}</h1>
        {programNotes && <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted }}>{programNotes}</p>}
      </div>

      {/* Week tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {weeks.map((w, wi) => {
          const weekDone = w.days.every((d) => completedDays.has(`${w.weekNumber}::${d.dayLabel}`))
          return (
            <button
              key={wi}
              onClick={() => setActiveWeek(wi)}
              style={{
                background: wi === activeWeek ? black : white,
                border: `1px solid ${wi === activeWeek ? black : border}`,
                color: wi === activeWeek ? white : muted,
                padding: "8px 18px",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.8rem",
                fontWeight: wi === activeWeek ? 700 : 400,
                cursor: "pointer",
                borderRadius: 4,
                position: "relative",
              }}
            >
              {w.label}
              {weekDone && (
                <span style={{ marginLeft: 6, color: accent, fontWeight: 700 }}>✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Day cards for selected week */}
      {week && (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {week.days.map((day, di) => {
            const isDone = completedDays.has(`${week.weekNumber}::${day.dayLabel}`)
            const href = `/my-coaching/workouts/${week.weekNumber}/${di}`

            return (
              <Link
                key={di}
                href={href}
                style={{
                  background: isDone ? "#f8fdf8" : white,
                  border: `1px solid ${isDone ? "#d4e8d4" : border}`,
                  borderRadius: 8,
                  padding: "1.25rem 1.5rem",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                } as React.CSSProperties}
              >
                {/* Done indicator */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: isDone ? "#5c9e6a" : "#f5f2ee",
                  border: `2px solid ${isDone ? "#5c9e6a" : border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3.5 6-7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, color: muted }}>{di + 1}</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.1rem", fontWeight: 700, color: black, margin: 0 }}>{day.dayLabel}</h3>
                    {isDone && <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 600, color: "#5c9e6a", letterSpacing: "0.08em" }}>COMPLETED</span>}
                  </div>
                  {day.notes && <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 10px" }}>{day.notes}</p>}

                  {/* Exercise preview thumbnails */}
                  {day.exercises.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: -6 }}>
                        {day.exercises.slice(0, 5).map((ex, ei) => (
                          <div key={ei} style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${white}`, overflow: "hidden", background: "#f5f2ee", marginLeft: ei > 0 ? -8 : 0, flexShrink: 0 }}>
                            {ex.videoS3Key && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={`${CDN}/${encodeURIComponent(ex.videoS3Key.replace(/\.mp4$/i, ".jpg"))}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            )}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted }}>
                        {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><path d="M6 4l4 4-4 4" stroke={muted} strokeWidth="1.3" strokeLinecap="round" /></svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
