"use client"

import { useState, useEffect } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

type CheckIn = {
  id: string
  clientEmail: string
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
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

function RatingDot({ value }: { value: number | null }) {
  if (!value) return <span style={{ color: muted, fontSize: "0.75rem" }}>—</span>
  const color = value >= 4 ? "#5c9e6a" : value >= 3 ? gold : "#d97460"
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 22, height: 22, borderRadius: "50%", background: `${color}22`, border: `1.5px solid ${color}`,
      fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", fontWeight: 700, color,
    }}>{value}</span>
  )
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function AdminCheckInsPage() {
  const [loading, setLoading] = useState(true)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [tab, setTab] = useState<"PENDING" | "REVIEWED" | "ALL">("PENDING")

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (!token) return
        const res = await fetch("/api/admin/coaching/check-ins", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const mapped = (data.checkIns ?? []).map((ci: Record<string, unknown>) => ({
          id: ci.id as string,
          clientEmail: ci.clientEmail as string,
          submittedAt: ci.submittedAt as string,
          status: (ci.status ?? "PENDING") as CheckIn["status"],
          weight: ci.weight != null ? Number(ci.weight) : null,
          weightUnit: (ci.weightUnit as string | null) ?? null,
          sleepQuality: ci.sleepQuality != null ? Number(ci.sleepQuality) : null,
          energyLevel: ci.energyLevel != null ? Number(ci.energyLevel) : null,
          trainingPerformance: ci.trainingPerformance != null ? Number(ci.trainingPerformance) : null,
          nutritionAdherence: ci.nutritionAdherence != null ? Number(ci.nutritionAdherence) : null,
          workoutConsistency: ci.workoutConsistency != null ? Number(ci.workoutConsistency) : null,
          wins: (ci.wins as string | null) ?? null,
          struggles: (ci.struggles as string | null) ?? null,
          questionsForCoach: (ci.questionsForCoach as string | null) ?? null,
        }))
        // Sort oldest-first for pending, newest-first for reviewed
        mapped.sort((a: CheckIn, b: CheckIn) => a.submittedAt.localeCompare(b.submittedAt))
        setCheckIns(mapped)
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = tab === "ALL" ? checkIns : checkIns.filter((ci) => ci.status === tab)
  const pendingCount = checkIns.filter((ci) => ci.status === "PENDING").length

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/admin/coaching" style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
            ← Coaching
          </Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, margin: "0 0 6px" }}>Review Queue</p>
              <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.2rem", fontWeight: 700, color: cream, margin: 0 }}>
                Check-Ins
                {pendingCount > 0 && (
                  <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: gold, color: "#111", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 700, verticalAlign: "middle" }}>
                    {pendingCount}
                  </span>
                )}
              </h1>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
          {(["PENDING", "REVIEWED", "ALL"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? gold : "transparent",
                border: `1px solid ${tab === t ? gold : border}`,
                color: tab === t ? "#111" : muted,
                padding: "7px 18px",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.75rem",
                fontWeight: tab === t ? 700 : 400,
                cursor: "pointer",
                borderRadius: 4,
                letterSpacing: "0.05em",
              }}
            >
              {t === "PENDING" ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}` : t === "REVIEWED" ? "Reviewed" : "All"}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "3rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", color: muted }}>
              {tab === "PENDING" ? "No pending check-ins" : "No check-ins yet"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {filtered.map((ci) => {
              const isPending = ci.status === "PENDING"
              return (
                <Link
                  key={ci.id}
                  href={`/admin/coaching/check-ins/${ci.id}`}
                  style={{
                    background: "#161616",
                    border: `1px solid ${isPending ? "#4a3820" : border}`,
                    borderRadius: 8,
                    padding: "1.25rem 1.5rem",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: isPending ? `${gold}22` : "#2a2a2a",
                          border: `1.5px solid ${isPending ? gold : border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, color: isPending ? gold : muted }}>
                            {ci.clientEmail.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.875rem", fontWeight: 600, color: cream, margin: 0 }}>
                            {ci.clientEmail}
                          </p>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, margin: 0 }}>
                            {formatDate(ci.submittedAt)}
                            {ci.weight ? ` · ${ci.weight} ${ci.weightUnit ?? ""}` : ""}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                        {[
                          ["SLEEP", ci.sleepQuality],
                          ["ENERGY", ci.energyLevel],
                          ["TRAINING", ci.trainingPerformance],
                          ["NUTRITION", ci.nutritionAdherence],
                          ["CONSISTENCY", ci.workoutConsistency],
                        ].map(([label, val]) => (
                          <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: muted, letterSpacing: "0.06em" }}>{label as string}</span>
                            <RatingDot value={val as number | null} />
                          </div>
                        ))}
                      </div>

                      {(ci.wins || ci.struggles || ci.questionsForCoach) && (
                        <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {ci.wins && (
                            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, margin: 0, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <span style={{ color: "#5c9e6a", marginRight: 4 }}>W:</span>{ci.wins}
                            </p>
                          )}
                          {ci.struggles && (
                            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, margin: 0, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <span style={{ color: "#d97460", marginRight: 4 }}>S:</span>{ci.struggles}
                            </p>
                          )}
                          {ci.questionsForCoach && (
                            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, margin: 0, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <span style={{ color: gold, marginRight: 4 }}>Q:</span>{ci.questionsForCoach}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                      <span style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: 4,
                        fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em",
                        background: isPending ? `${gold}18` : "#2a2a2a",
                        color: isPending ? gold : muted,
                        border: `1px solid ${isPending ? gold : border}`,
                      }}>
                        {isPending ? "PENDING" : "REVIEWED"}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke={muted} strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
