"use client"

import { useState, useEffect } from "react"
import { fetchUserAttributes } from "aws-amplify/auth"
import Link from "next/link"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

type ProgramDay = { dayLabel: string; notes: string; exercises: { exerciseId: string; name: string; sets: string; reps: string; weight: string }[] }
type ProgramWeek = { weekNumber: number; label: string; days: ProgramDay[] }

type ClientInfo = {
  displayName: string
  goal: string | null
  currentProgramId: string | null
  startDate: string | null
  weightUnit: "LBS" | "KG" | null
}

type ProgramInfo = {
  id: string
  name: string
  weeks: ProgramWeek[]
}

type WorkoutLog = {
  weekNumber: number
  dayLabel: string
  completedAt: string
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem 1.5rem" }}>
      <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>{value}</p>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: muted, margin: 0, letterSpacing: "0.04em" }}>{label}</p>
      {sub && <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: "#aaa9a6", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  )
}

export default function MyCoachingHomeClient() {
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [program, setProgram] = useState<ProgramInfo | null>(null)
  const [logs, setLogs] = useState<WorkoutLog[]>([])

  useEffect(() => {
    async function load() {
      try {
        const attrs = await fetchUserAttributes()
        const userEmail = attrs.email ?? ""
        setEmail(userEmail)

        const [programRes, logsRes] = await Promise.allSettled([
          fetch("/api/coaching/program").then((r) => r.json()),
          fetch("/api/coaching/workout-log").then((r) => r.json()),
        ])

        if (programRes.status === "fulfilled") {
          const c = programRes.value.client
          const prog = programRes.value.program
          if (c) {
            setClientInfo({
              displayName: c.displayName,
              goal: c.goal ?? null,
              currentProgramId: c.currentProgramId ?? null,
              startDate: c.startDate ?? null,
              weightUnit: (c.weightUnit ?? "LBS") as ClientInfo["weightUnit"],
            })
          }
          if (prog) {
            try {
              setProgram({ id: prog.id, name: prog.name, weeks: JSON.parse(prog.weeks) as ProgramWeek[] })
            } catch { /* invalid JSON */ }
          }
        }

        if (logsRes.status === "fulfilled") {
          const myLogs = (logsRes.value.logs ?? []).map((l: Record<string, unknown>) => ({
            weekNumber: Number(l.weekNumber),
            dayLabel: l.dayLabel as string,
            completedAt: l.completedAt as string,
          }))
          setLogs(myLogs)
        }
      } catch { /* auth error handled by layout */ }
      setLoading(false)
    }
    load()
  }, [])

  const firstName = clientInfo?.displayName.split(" ")[0] ?? ""

  const thisWeekLogs = logs.filter((l) => {
    const d = new Date(l.completedAt)
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    return d >= weekStart
  })

  const totalExercises = program?.weeks.reduce((sum, w) => sum + w.days.reduce((s, d) => s + d.exercises.length, 0), 0) ?? 0

  // Find next uncompleted day
  const nextWorkout = program ? (() => {
    for (const week of program.weeks) {
      for (const day of week.days) {
        const done = logs.some((l) => l.weekNumber === week.weekNumber && l.dayLabel === day.dayLabel)
        if (!done) return { week, day }
      }
    }
    return null
  })() : null

  if (loading) return <Spinner />

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, marginBottom: "0.4rem" }}>
          Welcome back
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, margin: "0 0 0.4rem" }}>
          {firstName ? `Hi, ${firstName} 👋` : "Your Coaching Portal"}
        </h1>
        {clientInfo?.goal && (
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted }}>
            Goal: {clientInfo.goal}
          </p>
        )}
      </div>

      {!program ? (
        /* No program yet */
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "2.5rem", textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fdf6ec", border: `2px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" /></svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: black, margin: "0 0 0.75rem" }}>
            Your program is being prepared
          </h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, maxWidth: 360, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
            Lisa is putting together your personalised program. You&apos;ll get an email when it&apos;s ready.
          </p>
          <Link href="/my-coaching/messages" style={{ display: "inline-block", background: accent, color: black, padding: "12px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textDecoration: "none", borderRadius: 4 }}>
            Message Lisa
          </Link>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <StatCard label="Workouts this week" value={thisWeekLogs.length} />
            <StatCard label="Total logged" value={logs.length} />
            <StatCard label="Program weeks" value={program.weeks.length} />
            <StatCard label="Exercises in program" value={totalExercises} />
          </div>

          {/* Next workout card */}
          {nextWorkout && (
            <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem 1.75rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, margin: "0 0 6px" }}>
                  Up next
                </p>
                <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.25rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>
                  {nextWorkout.week.label} — {nextWorkout.day.dayLabel}
                </h2>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: 0 }}>
                  {nextWorkout.day.exercises.length} exercise{nextWorkout.day.exercises.length !== 1 ? "s" : ""}
                  {nextWorkout.day.notes ? ` · ${nextWorkout.day.notes}` : ""}
                </p>
              </div>
              <Link
                href={`/my-coaching/workouts/${nextWorkout.week.weekNumber}/${nextWorkout.week.days.indexOf(nextWorkout.day)}`}
                style={{ display: "inline-block", background: black, color: white, padding: "12px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.06em", textDecoration: "none", borderRadius: 4, flexShrink: 0 }}
              >
                Start Workout →
              </Link>
            </div>
          )}

          {nextWorkout === null && (
            <div style={{ background: "#fdf9f5", border: `1px solid #f0e8dc`, borderRadius: 8, padding: "1.5rem 1.75rem", marginBottom: "1rem", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.2rem", fontWeight: 700, color: black, margin: "0 0 6px" }}>
                You&apos;ve completed all workouts! 🎉
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, margin: "0 0 16px" }}>
                Amazing work. Lisa will update your program soon.
              </p>
              <Link href="/my-coaching/workouts" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: accent, textDecoration: "none", fontWeight: 600 }}>
                View all workouts →
              </Link>
            </div>
          )}

          {/* Quick links */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginTop: "0.5rem" }}>
            {[
              { href: "/my-coaching/workouts", label: "All Workouts", desc: "View your full program" },
              { href: "/my-coaching/check-in", label: "Weekly Check-In", desc: "Submit your weekly update" },
              { href: "/my-coaching/progress", label: "Progress", desc: "Track measurements & photos" },
              { href: "/my-coaching/messages", label: "Messages", desc: "Chat with Lisa" },
            ].map(({ href, label, desc }) => (
              <Link key={href} href={href} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem", textDecoration: "none", display: "block" }}>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: 0 }}>{desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Email shown at bottom */}
      {email && (
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: "#ccc", marginTop: "2.5rem" }}>
          Signed in as {email}
        </p>
      )}
    </div>
  )
}
