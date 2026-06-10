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

type CheckIn = {
  id: string
  submittedAt: string
  status: "PENDING" | "REVIEWED" | null
  weight: number | null
  weightUnit: string | null
  sleepQuality: number | null
  energyLevel: number | null
  trainingPerformance: number | null
  nutritionAdherence: number | null
  workoutConsistency: number | null
  wins: string | null
  struggles: string | null
  questionsForCoach: string | null
  coachFeedback: string | null
  reviewedAt: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

function RatingBadge({ label, value }: { label: string; value: number | null }) {
  if (!value) return null
  const color = value >= 4 ? "#5c9e6a" : value >= 3 ? accent : "#d97460"
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${color}18`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 700, color }}>{value}</span>
      </div>
      <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", color: muted, textAlign: "center", maxWidth: 48 }}>{label}</span>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function CheckInHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const attrs = await fetchUserAttributes()
        const email = attrs.email ?? ""
        const db = generateClient<Schema>({ authMode: "userPool" })
        const { data } = await db.models.CoachingCheckIn.list({ authMode: "userPool" })
        const mine = data
          .filter((ci) => ci.clientEmail.toLowerCase() === email.toLowerCase())
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
          .map((ci) => ({
            id: ci.id,
            submittedAt: ci.submittedAt,
            status: (ci.status ?? "PENDING") as CheckIn["status"],
            weight: ci.weight ?? null,
            weightUnit: ci.weightUnit ?? null,
            sleepQuality: ci.sleepQuality ?? null,
            energyLevel: ci.energyLevel ?? null,
            trainingPerformance: ci.trainingPerformance ?? null,
            nutritionAdherence: ci.nutritionAdherence ?? null,
            workoutConsistency: ci.workoutConsistency ?? null,
            wins: ci.wins ?? null,
            struggles: ci.struggles ?? null,
            questionsForCoach: ci.questionsForCoach ?? null,
            coachFeedback: ci.coachFeedback ?? null,
            reviewedAt: ci.reviewedAt ?? null,
          }))
        setCheckIns(mine)
        if (mine.length > 0) setExpanded(mine[0].id)
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>Weekly</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, margin: 0 }}>Check-In History</h1>
        </div>
        <Link href="/my-coaching/check-in" style={{ display: "inline-block", background: black, color: white, padding: "10px 22px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
          + New Check-In
        </Link>
      </div>

      {checkIns.length === 0 ? (
        <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "3rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.3rem", color: muted, margin: "0 0 12px" }}>No check-ins yet</p>
          <Link href="/my-coaching/check-in" style={{ display: "inline-block", background: accent, color: black, padding: "11px 24px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
            Submit Your First Check-In
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {checkIns.map((ci) => {
            const isOpen = expanded === ci.id
            const reviewed = ci.status === "REVIEWED"
            return (
              <div key={ci.id} style={{ background: white, border: `1px solid ${reviewed ? "#d4e8d4" : border}`, borderRadius: 8, overflow: "hidden" }}>
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : ci.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: reviewed ? "#5c9e6a" : accent,
                    }} />
                    <div>
                      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", fontWeight: 600, color: black, margin: 0 }}>
                        {formatDate(ci.submittedAt)}
                      </p>
                      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: muted, margin: 0 }}>
                        {ci.weight ? `${ci.weight} ${ci.weightUnit ?? ""}` : "No weight logged"}
                        {reviewed ? " · Feedback received" : " · Awaiting feedback"}
                      </p>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                    <path d="M4 6l4 4 4-4" stroke={muted} strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${border}`, padding: "1.25rem" }}>
                    {/* Ratings row */}
                    <div style={{ display: "flex", gap: 16, marginBottom: "1.25rem", flexWrap: "wrap" }}>
                      <RatingBadge label="Sleep" value={ci.sleepQuality} />
                      <RatingBadge label="Energy" value={ci.energyLevel} />
                      <RatingBadge label="Training" value={ci.trainingPerformance} />
                      <RatingBadge label="Nutrition" value={ci.nutritionAdherence} />
                      <RatingBadge label="Consistency" value={ci.workoutConsistency} />
                    </div>

                    {/* Text responses */}
                    {ci.wins && (
                      <div style={{ marginBottom: "1rem" }}>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>Wins</p>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: black, lineHeight: 1.5, margin: 0 }}>{ci.wins}</p>
                      </div>
                    )}
                    {ci.struggles && (
                      <div style={{ marginBottom: "1rem" }}>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>Struggles</p>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: black, lineHeight: 1.5, margin: 0 }}>{ci.struggles}</p>
                      </div>
                    )}
                    {ci.questionsForCoach && (
                      <div style={{ marginBottom: "1rem" }}>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>Questions for Lisa</p>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: black, lineHeight: 1.5, margin: 0 }}>{ci.questionsForCoach}</p>
                      </div>
                    )}

                    {/* Coach feedback */}
                    {ci.coachFeedback && (
                      <div style={{ background: "#fdf9f4", border: `1px solid #f0e4cc`, borderRadius: 6, padding: "1rem 1.25rem", marginTop: "0.75rem" }}>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: accent, margin: "0 0 8px" }}>
                          Lisa&apos;s Feedback · {ci.reviewedAt ? formatDate(ci.reviewedAt) : ""}
                        </p>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", color: black, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{ci.coachFeedback}</p>
                      </div>
                    )}

                    {!reviewed && (
                      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, marginTop: "0.75rem", fontStyle: "italic" }}>
                        Awaiting feedback from Lisa (usually within 48 hours).
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
