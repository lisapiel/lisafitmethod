"use client"

import { useState, useEffect } from "react"
import { fetchUserAttributes } from "aws-amplify/auth"

const gold = "#c9a96e"
const border = "#2a2a2a"

type Completion = {
  key: string
  blockId: string
  dayLabel: string
  completedAt: string
}

export default function ProgressPage() {
  const [completions, setCompletions] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserAttributes()
      .then(async (attrs) => {
        const email = attrs.email
        if (!email) return
        const res = await fetch(`/api/masterclass/progress?email=${encodeURIComponent(email)}`)
        if (!res.ok) return
        const data = await res.json() as { completions: Completion[] }
        setCompletions(data.completions ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalWorkouts = completions.length

  // Streak: count consecutive weeks with at least 1 completion
  const getStreak = () => {
    if (!completions.length) return 0
    const sorted = [...completions].sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    const getWeek = (iso: string) => {
      const d = new Date(iso)
      const jan1 = new Date(d.getFullYear(), 0, 1)
      return Math.floor((d.getTime() - jan1.getTime()) / (7 * 24 * 60 * 60 * 1000))
    }
    const weeks = [...new Set(sorted.map((c) => `${new Date(c.completedAt).getFullYear()}-${getWeek(c.completedAt)}`))].sort().reverse()
    let streak = 1
    for (let i = 1; i < weeks.length; i++) {
      const [yr, wk] = weeks[i - 1].split("-").map(Number)
      const [pyr, pwk] = weeks[i].split("-").map(Number)
      if (yr === pyr && wk - pwk === 1) streak++
      else if (yr - pyr === 1 && pwk === 52 && wk === 0) streak++
      else break
    }
    return streak
  }

  const streak = getStreak()

  // Last 12 weeks heatmap
  const now = new Date()
  const weeks: { label: string; days: { date: string; completed: boolean }[] }[] = []
  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (now.getDay()) - w * 7)
    const days = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + d)
      const iso = day.toISOString().split("T")[0]
      days.push({ date: iso, completed: completions.some((c) => c.completedAt.startsWith(iso)) })
    }
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    weeks.push({ label, days })
  }

  return (
    <div style={{ padding: "2rem 2rem 4rem", maxWidth: 760 }}>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 300, color: "#f0e6d3", marginBottom: "2rem" }}>
        My Progress
      </h1>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: "2.5rem" }}>
        {[
          { label: "Total Workouts", value: totalWorkouts },
          { label: "Week Streak", value: streak },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#111", border: `1px solid ${border}`, borderRadius: 2, padding: "20px 24px" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>{label}</p>
            <p style={{ margin: "8px 0 0", fontFamily: "var(--font-cormorant), serif", fontSize: "3rem", fontWeight: 300, color: "#f0e6d3", lineHeight: 1 }}>{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "1rem" }}>
          Last 12 Weeks
        </p>
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8 }}>
          {weeks.map((week) => (
            <div key={week.label} style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
              {week.days.map((day) => (
                <div
                  key={day.date}
                  title={day.date}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 2,
                    background: day.completed ? gold : "#1a1a1a",
                    border: `1px solid ${day.completed ? gold : border}`,
                    transition: "background 0.1s",
                    flexShrink: 0,
                  }}
                />
              ))}
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.45rem", color: "#444", marginTop: 3, whiteSpace: "nowrap", transform: "rotate(-45deg) translateX(-4px)", transformOrigin: "left top" }}>
                {week.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent completions */}
      {completions.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${border}` }}>
            Recent Workouts
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[...completions]
              .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
              .slice(0, 10)
              .map((c) => (
                <div key={c.key} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid #1a1a1a` }}>
                  <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#f0e6d3" }}>
                    {c.dayLabel}
                  </p>
                  <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555" }}>
                    {new Date(c.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
