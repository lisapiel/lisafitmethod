"use client"

import { useState, useEffect, use } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
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
  hungerLevel: number | null
  stressLevel: number | null
  digestion: number | null
  trainingPerformance: number | null
  nutritionAdherence: number | null
  workoutConsistency: number | null
  wins: string | null
  struggles: string | null
  questionsForCoach: string | null
  additionalNotes: string | null
  coachFeedback: string | null
  reviewedAt: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

function RatingRow({ label, value }: { label: string; value: number | null }) {
  if (!value) return null
  const color = value >= 4 ? "#5c9e6a" : value >= 3 ? gold : "#d97460"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, letterSpacing: "0.06em", width: 130, flexShrink: 0 }}>{label.toUpperCase()}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} style={{ width: 28, height: 10, borderRadius: 3, background: n <= value ? color : "#2a2a2a" }} />
        ))}
      </div>
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, color }}>{value}/5</span>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 8px" }}>{label}</p>
      {children}
    </div>
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

export default function AdminCheckInReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState("")
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null)
  const [clientName, setClientName] = useState("")
  const [feedback, setFeedback] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchAuthSession()
        const accessToken = session.tokens?.accessToken?.toString() ?? ""
        setToken(accessToken)
        if (!accessToken) return

        const [ciRes, clientsRes] = await Promise.allSettled([
          fetch(`/api/admin/coaching/check-ins/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch("/api/admin/coaching/clients", { headers: { Authorization: `Bearer ${accessToken}` } }),
        ])

        if (ciRes.status === "fulfilled" && ciRes.value.ok) {
          const data = await ciRes.value.json()
          const ci = data.checkIn
          setCheckIn({
            id: ci.id,
            clientEmail: ci.clientEmail,
            submittedAt: ci.submittedAt,
            status: (ci.status ?? "PENDING") as CheckIn["status"],
            weight: ci.weight != null ? Number(ci.weight) : null,
            weightUnit: ci.weightUnit ?? null,
            sleepQuality: ci.sleepQuality != null ? Number(ci.sleepQuality) : null,
            energyLevel: ci.energyLevel != null ? Number(ci.energyLevel) : null,
            hungerLevel: ci.hungerLevel != null ? Number(ci.hungerLevel) : null,
            stressLevel: ci.stressLevel != null ? Number(ci.stressLevel) : null,
            digestion: ci.digestion != null ? Number(ci.digestion) : null,
            trainingPerformance: ci.trainingPerformance != null ? Number(ci.trainingPerformance) : null,
            nutritionAdherence: ci.nutritionAdherence != null ? Number(ci.nutritionAdherence) : null,
            workoutConsistency: ci.workoutConsistency != null ? Number(ci.workoutConsistency) : null,
            wins: ci.wins ?? null,
            struggles: ci.struggles ?? null,
            questionsForCoach: ci.questionsForCoach ?? null,
            additionalNotes: ci.additionalNotes ?? null,
            coachFeedback: ci.coachFeedback ?? null,
            reviewedAt: ci.reviewedAt ?? null,
          })
          if (ci.coachFeedback) setFeedback(ci.coachFeedback)

          // Look up client name
          if (clientsRes.status === "fulfilled" && clientsRes.value.ok) {
            const clientData = await clientsRes.value.json()
            const match = (clientData.clients ?? []).find(
              (c: { email: string; displayName: string }) => c.email.toLowerCase() === ci.clientEmail.toLowerCase()
            )
            if (match) setClientName(match.displayName)
          }
        }
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [id])

  async function sendFeedback() {
    if (!checkIn || !feedback.trim() || !token) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/coaching/check-ins/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedback.trim() }),
      })
      if (res.ok) {
        setSaved(true)
        setCheckIn((prev) => prev ? {
          ...prev,
          status: "REVIEWED",
          coachFeedback: feedback.trim(),
          reviewedAt: new Date().toISOString(),
        } : prev)
      }
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}><Spinner /></div>
    </div>
  )

  if (!checkIn) return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <p style={{ color: muted }}>Check-in not found.</p>
        <Link href="/admin/coaching/check-ins" style={{ color: gold, fontSize: "0.8rem" }}>← Back to queue</Link>
      </div>
    </div>
  )

  const reviewed = checkIn.status === "REVIEWED"

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/admin/coaching/check-ins" style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1.5rem" }}>
          ← Check-In Queue
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, margin: "0 0 6px" }}>
              {formatDate(checkIn.submittedAt)}
            </p>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 700, color: cream, margin: "0 0 4px" }}>
              {clientName || checkIn.clientEmail}
            </h1>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, margin: 0 }}>
              {checkIn.clientEmail}
            </p>
          </div>
          <span style={{
            display: "inline-block", padding: "5px 14px", borderRadius: 4,
            fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em",
            background: reviewed ? "#2a2a2a" : `${gold}18`,
            color: reviewed ? "#5c9e6a" : gold,
            border: `1px solid ${reviewed ? "#3a3a3a" : gold}`,
          }}>
            {reviewed ? "REVIEWED" : "PENDING REVIEW"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Left column */}
          <div>
            {checkIn.weight && (
              <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem", marginBottom: "1rem" }}>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 6px" }}>Weight</p>
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 700, color: cream, margin: 0 }}>
                  {checkIn.weight} <span style={{ fontSize: "1rem", fontWeight: 400, color: muted }}>{checkIn.weightUnit ?? ""}</span>
                </p>
              </div>
            )}

            <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem", marginBottom: "1rem" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>Wellbeing</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <RatingRow label="Sleep Quality" value={checkIn.sleepQuality} />
                <RatingRow label="Energy Level" value={checkIn.energyLevel} />
                <RatingRow label="Hunger Level" value={checkIn.hungerLevel} />
                <RatingRow label="Stress Level" value={checkIn.stressLevel} />
                <RatingRow label="Digestion" value={checkIn.digestion} />
              </div>
            </div>

            <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>Training & Nutrition</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <RatingRow label="Training" value={checkIn.trainingPerformance} />
                <RatingRow label="Nutrition" value={checkIn.nutritionAdherence} />
                <RatingRow label="Consistency" value={checkIn.workoutConsistency} />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem", marginBottom: "1rem" }}>
              {checkIn.wins ? <Section label="Wins"><p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, lineHeight: 1.6, margin: 0 }}>{checkIn.wins}</p></Section> : null}
              {checkIn.struggles ? <Section label="Struggles"><p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, lineHeight: 1.6, margin: 0 }}>{checkIn.struggles}</p></Section> : null}
              {checkIn.questionsForCoach ? <Section label="Questions for You"><p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: "#e8c98a", lineHeight: 1.6, margin: 0 }}>{checkIn.questionsForCoach}</p></Section> : null}
              {checkIn.additionalNotes ? <Section label="Additional Notes"><p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, lineHeight: 1.6, margin: 0 }}>{checkIn.additionalNotes}</p></Section> : null}
              {!checkIn.wins && !checkIn.struggles && !checkIn.questionsForCoach && !checkIn.additionalNotes && (
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: muted, textAlign: "center", padding: "1rem 0" }}>No text responses</p>
              )}
            </div>
          </div>
        </div>

        {/* Feedback composer */}
        <div style={{ background: "#161616", border: `1px solid ${reviewed ? "#3a3820" : `${gold}44`}`, borderRadius: 8, padding: "1.5rem", marginTop: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>
            {reviewed ? `Your Feedback · ${checkIn.reviewedAt ? formatDate(checkIn.reviewedAt) : ""}` : "Write Feedback"}
          </p>
          <textarea
            value={feedback}
            onChange={(e) => { setFeedback(e.target.value); setSaved(false) }}
            placeholder="Write your feedback for this client. Be specific — what's working, what to adjust, encouragement..."
            rows={8}
            style={{
              width: "100%", background: "#111", border: `1px solid ${border}`, borderRadius: 6,
              color: cream, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.875rem",
              lineHeight: 1.6, padding: "0.875rem 1rem", resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
            <div>
              {saved && (
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#5c9e6a", margin: 0 }}>
                  ✓ Feedback sent — client notified
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => router.push("/admin/coaching/check-ins")}
                style={{ background: "transparent", border: `1px solid ${border}`, color: muted, padding: "10px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", cursor: "pointer", borderRadius: 4 }}
              >
                Back to Queue
              </button>
              <button
                onClick={sendFeedback}
                disabled={saving || !feedback.trim()}
                style={{
                  background: feedback.trim() ? gold : "#2a2a2a", border: "none",
                  color: feedback.trim() ? "#111" : muted, padding: "10px 24px",
                  fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 700,
                  cursor: feedback.trim() ? "pointer" : "not-allowed", borderRadius: 4, transition: "background 0.15s",
                }}
              >
                {saving ? "Sending..." : reviewed ? "Update Feedback" : "Send Feedback"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
