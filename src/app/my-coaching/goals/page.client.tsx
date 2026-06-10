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

type Goal = {
  id: string
  type: string
  label: string | null
  startDate: string | null
  targetDate: string | null
  startValue: number | null
  targetValue: number | null
  currentValue: number | null
  unit: string | null
  notes: string | null
  status: "ON_TRACK" | "NEEDS_ATTENTION" | "ACHIEVED" | null
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  ON_TRACK: { color: "#5c9e6a", bg: "#f0faf0", label: "On Track" },
  NEEDS_ATTENTION: { color: "#d97460", bg: "#fdf5f4", label: "Needs Attention" },
  ACHIEVED: { color: accent, bg: "#fdf9f4", label: "Achieved ✓" },
}

function ProgressBar({ start, current, target }: { start: number | null; current: number | null; target: number | null }) {
  if (start === null || current === null || target === null) return null
  const range = target - start
  if (range === 0) return null
  const pct = Math.max(0, Math.min(100, ((current - start) / range) * 100))
  const isNegative = target < start
  const adjPct = isNegative ? Math.max(0, Math.min(100, ((start - current) / (start - target)) * 100)) : pct

  return (
    <div style={{ margin: "10px 0 4px" }}>
      <div style={{ height: 6, background: border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${adjPct}%`, height: "100%", background: accent, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: muted }}>Start: {start}</span>
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: black, fontWeight: 600 }}>{Math.round(adjPct)}%</span>
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: muted }}>Target: {target}</span>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function GoalsClient() {
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    async function load() {
      try {
        const attrs = await fetchUserAttributes()
        const email = attrs.email ?? ""
        const db = generateClient<Schema>({ authMode: "userPool" })
        const { data } = await db.models.CoachingGoal.list({ authMode: "userPool" })
        setGoals(
          data
            .filter((g: { clientEmail: string; status?: string | null }) => g.clientEmail.toLowerCase() === email.toLowerCase())
            .sort((a: { status?: string | null }, b: { status?: string | null }) => {
              const statusOrder: Record<string, number> = { ON_TRACK: 0, NEEDS_ATTENTION: 1, ACHIEVED: 2 }
              return (statusOrder[a.status ?? ""] ?? 0) - (statusOrder[b.status ?? ""] ?? 0)
            })
            .map((g: { id: string; type: string; label?: string | null; startDate?: string | null; targetDate?: string | null; startValue?: number | null; targetValue?: number | null; currentValue?: number | null; unit?: string | null; notes?: string | null; status?: string | null }) => ({
              id: g.id,
              type: g.type,
              label: g.label ?? null,
              startDate: g.startDate ?? null,
              targetDate: g.targetDate ?? null,
              startValue: g.startValue ?? null,
              targetValue: g.targetValue ?? null,
              currentValue: g.currentValue ?? null,
              unit: g.unit ?? null,
              notes: g.notes ?? null,
              status: (g.status ?? null) as Goal["status"],
            }))
        )
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>Your</p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, margin: 0 }}>Goals</h1>
      </div>

      {goals.length === 0 ? (
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "3rem 2rem", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${accent}18`, border: `1.5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke={accent} strokeWidth="1.4" />
              <circle cx="11" cy="11" r="5" stroke={accent} strokeWidth="1.4" />
              <circle cx="11" cy="11" r="1.5" fill={accent} />
            </svg>
          </div>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.3rem", color: black, margin: "0 0 8px" }}>No goals set yet</p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 24px", lineHeight: 1.6, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
            Lisa will set your goals after reviewing your first check-in. Have specific goals in mind? Let her know.
          </p>
          <Link href="/my-coaching/messages" style={{ display: "inline-block", background: accent, color: black, padding: "12px 24px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
            Message Lisa
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {goals.map((goal) => {
            const statusStyle = STATUS_STYLE[goal.status ?? ""] ?? { color: muted, bg: white, label: "" }
            return (
              <div key={goal.id} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 3px" }}>
                      {goal.type.replace(/-/g, " ")}
                    </p>
                    <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.2rem", fontWeight: 700, color: black, margin: 0 }}>
                      {goal.label || goal.type}
                    </h3>
                  </div>
                  {goal.status && (
                    <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.color}44`, padding: "4px 10px", borderRadius: 4, flexShrink: 0 }}>
                      {statusStyle.label}
                    </span>
                  )}
                </div>

                {/* Value display */}
                {(goal.currentValue !== null || goal.targetValue !== null) && (
                  <div style={{ display: "flex", gap: 20, marginBottom: 4, flexWrap: "wrap" }}>
                    {goal.currentValue !== null && (
                      <div>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 1px" }}>Current</p>
                        <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: black, margin: 0 }}>{goal.currentValue}{goal.unit ? <span style={{ fontSize: "0.8rem", fontWeight: 400, color: muted }}> {goal.unit}</span> : ""}</p>
                      </div>
                    )}
                    {goal.targetValue !== null && (
                      <div>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 1px" }}>Target</p>
                        <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: accent, margin: 0 }}>{goal.targetValue}{goal.unit ? <span style={{ fontSize: "0.8rem", fontWeight: 400, color: muted }}> {goal.unit}</span> : ""}</p>
                      </div>
                    )}
                  </div>
                )}

                <ProgressBar start={goal.startValue} current={goal.currentValue} target={goal.targetValue} />

                {/* Target date */}
                {goal.targetDate && (
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: muted, margin: "8px 0 0" }}>
                    Target date: {new Date(goal.targetDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}

                {goal.notes && (
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "8px 0 0", lineHeight: 1.5 }}>{goal.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
