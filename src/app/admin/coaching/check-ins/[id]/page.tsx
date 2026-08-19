"use client"

import { useState, useEffect, use } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SignedVideo } from "@/components/coaching/NutritionComposer.client"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

type FormReview = { exercise: string; note: string; videoKeys: string[] }

type CheckIn = {
  id: string
  clientEmail: string
  submittedAt: string
  status: "PENDING" | "REVIEWED" | null
  schemaVersion: number | null
  // Progress
  weight: number | null
  weightUnit: string | null
  measurementSnapshot: string | null
  // Legacy 1–5 ratings
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
  // v2 — Training
  workoutsCompleted: number | null
  workoutsPlanned: number | null
  trainingRating: number | null
  trainingWins: string | null
  trainingChallenges: string | null
  // v2 — Attention
  painReported: boolean | null
  painNotes: string | null
  // v2 — Form review
  formReviewRequested: boolean | null
  formReviews: FormReview[]
  // v2 — Recovery
  recoveryRating: number | null
  // v2 — Nutrition
  nutritionStatus: string | null
  nutritionHelp: string | null
  // v2 — Weekly reflection
  weeklyWin: string | null
  weeklyChallenge: string | null
  adjustmentAreas: string[]
  adjustmentNotes: string | null
  questionForLisa: string | null
  // Coach
  coachFeedback: string | null
  reviewedAt: string | null
}

const NUTRITION_STATUS_LABEL: Record<string, string> = {
  "on-track": "On track",
  "mostly-on-track": "Mostly on track",
  "mixed": "Mixed",
  "struggled": "Struggled",
  "not-focusing": "Not focusing on nutrition",
}
const ADJUSTMENT_LABEL: Record<string, string> = {
  "exercises": "Exercise selection",
  "volume-intensity": "Volume / intensity",
  "schedule": "Schedule",
  "nutrition": "Nutrition",
  "recovery": "Recovery",
  "other": "Something else",
  "none": "Nothing right now",
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

function TextBlock({ text }: { text: string }) {
  return <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{text}</p>
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem", marginBottom: "1rem" }}>{children}</div>
}

function Chip({ label, tone = "neutral" }: { label: string; tone?: "attention" | "info" | "neutral" }) {
  const bg = tone === "attention" ? "#3a1f1f" : tone === "info" ? `${gold}18` : "#222"
  const fg = tone === "attention" ? "#e07a7a" : tone === "info" ? gold : cream
  const bd = tone === "attention" ? "#5a2a2a" : tone === "info" ? `${gold}55` : border
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: bg, color: fg, border: `1px solid ${bd}`,
      padding: "5px 10px", borderRadius: 999,
      fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em",
    }}>{label}</span>
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
          let formReviews: FormReview[] = []
          try {
            if (ci.formReviews) {
              const raw = JSON.parse(ci.formReviews) as unknown[]
              formReviews = raw.map((r) => {
                const rr = r as Record<string, unknown>
                return {
                  exercise: String(rr.exercise ?? ""),
                  note: String(rr.note ?? ""),
                  videoKeys: Array.isArray(rr.videoKeys) ? (rr.videoKeys as unknown[]).filter((k): k is string => typeof k === "string") : [],
                }
              })
            }
          } catch { /* keep empty */ }
          const adjustmentAreas: string[] = typeof ci.adjustmentAreas === "string" && ci.adjustmentAreas
            ? ci.adjustmentAreas.split(",").map((s: string) => s.trim()).filter(Boolean)
            : []
          setCheckIn({
            id: ci.id,
            clientEmail: ci.clientEmail,
            submittedAt: ci.submittedAt,
            status: (ci.status ?? "PENDING") as CheckIn["status"],
            schemaVersion: ci.schemaVersion != null ? Number(ci.schemaVersion) : null,
            weight: ci.weight != null ? Number(ci.weight) : null,
            weightUnit: ci.weightUnit ?? null,
            measurementSnapshot: ci.measurementSnapshot ?? null,
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
            workoutsCompleted: ci.workoutsCompleted != null ? Number(ci.workoutsCompleted) : null,
            workoutsPlanned: ci.workoutsPlanned != null ? Number(ci.workoutsPlanned) : null,
            trainingRating: ci.trainingRating != null ? Number(ci.trainingRating) : null,
            trainingWins: ci.trainingWins ?? null,
            trainingChallenges: ci.trainingChallenges ?? null,
            painReported: typeof ci.painReported === "boolean" ? ci.painReported : null,
            painNotes: ci.painNotes ?? null,
            formReviewRequested: typeof ci.formReviewRequested === "boolean" ? ci.formReviewRequested : null,
            formReviews,
            recoveryRating: ci.recoveryRating != null ? Number(ci.recoveryRating) : null,
            nutritionStatus: ci.nutritionStatus ?? null,
            nutritionHelp: ci.nutritionHelp ?? null,
            weeklyWin: ci.weeklyWin ?? null,
            weeklyChallenge: ci.weeklyChallenge ?? null,
            adjustmentAreas,
            adjustmentNotes: ci.adjustmentNotes ?? null,
            questionForLisa: ci.questionForLisa ?? null,
            coachFeedback: ci.coachFeedback ?? null,
            reviewedAt: ci.reviewedAt ?? null,
          })
          if (ci.coachFeedback) setFeedback(ci.coachFeedback)

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
        setCheckIn((prev) => prev ? { ...prev, status: "REVIEWED", coachFeedback: feedback.trim(), reviewedAt: new Date().toISOString() } : prev)
      }
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}><Spinner /></div>
    </div>
  )

  if (!checkIn) return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{ color: muted }}>Check-in not found.</p>
        <Link href="/admin/coaching/check-ins" style={{ color: gold, fontSize: "0.8rem" }}>← Back to queue</Link>
      </div>
    </div>
  )

  const reviewed = checkIn.status === "REVIEWED"
  const isV2 = checkIn.schemaVersion === 2

  // High-signal chips shown at the top so Lisa spots what needs attention.
  const chips: Array<{ label: string; tone: "attention" | "info" | "neutral" }> = []
  if (checkIn.painReported === true) chips.push({ label: "Pain / discomfort reported", tone: "attention" })
  if (checkIn.formReviewRequested === true) {
    const videoCount = checkIn.formReviews.reduce((n, r) => n + r.videoKeys.length, 0)
    chips.push({ label: `Form review requested${videoCount > 0 ? ` · ${videoCount} video${videoCount === 1 ? "" : "s"}` : ""}`, tone: "info" })
  }
  const meaningfulAdjustments = checkIn.adjustmentAreas.filter((a) => a !== "none")
  if (meaningfulAdjustments.length > 0) chips.push({ label: "Program adjustment requested", tone: "info" })
  if (checkIn.questionForLisa && checkIn.questionForLisa.trim()) chips.push({ label: "Question for you", tone: "info" })

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link href="/admin/coaching/check-ins" style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1.5rem" }}>
          ← Check-In Queue
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, margin: "0 0 6px" }}>{formatDate(checkIn.submittedAt)}</p>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 700, color: cream, margin: "0 0 4px" }}>{clientName || checkIn.clientEmail}</h1>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, margin: 0 }}>{checkIn.clientEmail}</p>
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

        {/* High-signal chips */}
        {chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.5rem" }}>
            {chips.map((c) => <Chip key={c.label} label={c.label} tone={c.tone} />)}
          </div>
        )}

        {/* ── Content columns ─────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
          {/* Left column — Progress + Training + Recovery */}
          <div>
            {/* Progress card */}
            {(checkIn.weight != null || checkIn.measurementSnapshot) && (
              <Card>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 10px" }}>Progress</p>
                {checkIn.weight != null && (
                  <div style={{ marginBottom: checkIn.measurementSnapshot ? 14 : 0 }}>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>Weight</p>
                    <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 700, color: cream, margin: 0 }}>
                      {checkIn.weight} <span style={{ fontSize: "1rem", fontWeight: 400, color: muted }}>{checkIn.weightUnit ?? ""}</span>
                    </p>
                  </div>
                )}
                {(() => {
                  let ms: Array<{ label: string; value: string; unit: string }> = []
                  try { if (checkIn.measurementSnapshot) ms = JSON.parse(checkIn.measurementSnapshot) } catch { /* ignore */ }
                  if (ms.length === 0) return null
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>Measurements</p>
                      {ms.map((m, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0", borderBottom: i === ms.length - 1 ? "none" : "1px solid #1e1e1e" }}>
                          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: cream, textTransform: "capitalize" }}>{m.label}</span>
                          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.82rem", fontWeight: 600, color: cream }}>{m.value}{m.unit ? ` ${m.unit}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </Card>
            )}

            {/* Training — v2 layout */}
            {isV2 && (
              <Card>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 10px" }}>Training</p>
                {checkIn.workoutsCompleted != null && (
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, margin: "0 0 12px", fontWeight: 600 }}>
                    {checkIn.workoutsPlanned != null
                      ? `${checkIn.workoutsCompleted} of ${checkIn.workoutsPlanned} planned workouts completed`
                      : `${checkIn.workoutsCompleted} workout${checkIn.workoutsCompleted === 1 ? "" : "s"} completed`}
                  </p>
                )}
                {checkIn.trainingRating != null && <RatingRow label="Training feel" value={checkIn.trainingRating} />}
                {checkIn.trainingWins && <div style={{ marginTop: 14 }}><Section label="What felt good"><TextBlock text={checkIn.trainingWins} /></Section></div>}
                {checkIn.trainingChallenges && <div style={{ marginTop: 6 }}><Section label="Didn't enjoy / wants changed"><TextBlock text={checkIn.trainingChallenges} /></Section></div>}
              </Card>
            )}

            {/* Attention — pain + program adjustments (v2) */}
            {isV2 && (checkIn.painReported === true || meaningfulAdjustments.length > 0) && (
              <Card>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#e07a7a", margin: "0 0 10px" }}>Attention</p>
                {checkIn.painReported === true && (
                  <div style={{ marginBottom: meaningfulAdjustments.length > 0 ? 14 : 0 }}>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: 700, color: cream, margin: "0 0 6px" }}>Pain / discomfort</p>
                    {checkIn.painNotes
                      ? <TextBlock text={checkIn.painNotes} />
                      : <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: muted, margin: 0, fontStyle: "italic" }}>Reported, no details provided.</p>}
                  </div>
                )}
                {meaningfulAdjustments.length > 0 && (
                  <div>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: 700, color: cream, margin: "0 0 6px" }}>Adjustment requested</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: checkIn.adjustmentNotes ? 8 : 0 }}>
                      {meaningfulAdjustments.map((a) => <Chip key={a} label={ADJUSTMENT_LABEL[a] ?? a} tone="info" />)}
                    </div>
                    {checkIn.adjustmentNotes && <TextBlock text={checkIn.adjustmentNotes} />}
                  </div>
                )}
              </Card>
            )}

            {/* Recovery — v2 layout (uses shared sleep/energy/stress + new recovery) */}
            {isV2 && (checkIn.sleepQuality || checkIn.energyLevel || checkIn.stressLevel || checkIn.recoveryRating) && (
              <Card>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>Recovery</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <RatingRow label="Sleep" value={checkIn.sleepQuality} />
                  <RatingRow label="Energy" value={checkIn.energyLevel} />
                  <RatingRow label="Stress mgmt" value={checkIn.stressLevel} />
                  <RatingRow label="Recovery" value={checkIn.recoveryRating} />
                </div>
              </Card>
            )}

            {/* Legacy wellbeing block (v1) */}
            {!isV2 && (checkIn.sleepQuality || checkIn.energyLevel || checkIn.hungerLevel || checkIn.stressLevel || checkIn.digestion) && (
              <Card>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>Wellbeing</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <RatingRow label="Sleep Quality" value={checkIn.sleepQuality} />
                  <RatingRow label="Energy Level" value={checkIn.energyLevel} />
                  <RatingRow label="Hunger Level" value={checkIn.hungerLevel} />
                  <RatingRow label="Stress Level" value={checkIn.stressLevel} />
                  <RatingRow label="Digestion" value={checkIn.digestion} />
                </div>
              </Card>
            )}
            {!isV2 && (checkIn.trainingPerformance || checkIn.nutritionAdherence || checkIn.workoutConsistency) && (
              <Card>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>Training &amp; Nutrition</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <RatingRow label="Training" value={checkIn.trainingPerformance} />
                  <RatingRow label="Nutrition" value={checkIn.nutritionAdherence} />
                  <RatingRow label="Consistency" value={checkIn.workoutConsistency} />
                </div>
              </Card>
            )}
          </div>

          {/* Right column — Form review + Nutrition + Weekly reflection */}
          <div>
            {isV2 && checkIn.formReviewRequested === true && checkIn.formReviews.length > 0 && (
              <Card>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>Form Review</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {checkIn.formReviews.map((r, i) => (
                    <div key={i} style={{ background: "#111", border: `1px solid ${border}`, borderRadius: 6, padding: 12 }}>
                      {r.exercise && (
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", fontWeight: 700, color: cream, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          <span style={{ color: muted, fontWeight: 500 }}>Exercise: </span>{r.exercise}
                        </p>
                      )}
                      {r.note && (
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, margin: "0 0 10px", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                          <span style={{ color: muted, fontSize: "0.7rem" }}>Client note: </span>&ldquo;{r.note}&rdquo;
                        </p>
                      )}
                      {r.videoKeys.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {r.videoKeys.map((k) => (
                            <SignedVideo
                              key={k}
                              s3Key={k}
                              style={{ width: "100%", maxHeight: 360, background: "#000", borderRadius: 4, display: "block" }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {isV2 && (checkIn.nutritionStatus || checkIn.nutritionHelp) && (
              <Card>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 10px" }}>Nutrition</p>
                {checkIn.nutritionStatus && (
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, margin: "0 0 10px", fontWeight: 600 }}>
                    {NUTRITION_STATUS_LABEL[checkIn.nutritionStatus] ?? checkIn.nutritionStatus}
                  </p>
                )}
                {checkIn.nutritionHelp && <Section label="Wants help with"><TextBlock text={checkIn.nutritionHelp} /></Section>}
              </Card>
            )}

            {isV2 && (checkIn.weeklyWin || checkIn.weeklyChallenge || checkIn.questionForLisa) && (
              <Card>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 10px" }}>Weekly Reflection</p>
                {checkIn.weeklyWin && <Section label="Biggest win"><TextBlock text={checkIn.weeklyWin} /></Section>}
                {checkIn.weeklyChallenge && <Section label="Biggest challenge"><TextBlock text={checkIn.weeklyChallenge} /></Section>}
                {checkIn.questionForLisa && (
                  <Section label="Question for you">
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem", color: "#e8c98a", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{checkIn.questionForLisa}</p>
                  </Section>
                )}
              </Card>
            )}

            {/* Legacy text block (v1) */}
            {!isV2 && (checkIn.wins || checkIn.struggles || checkIn.questionsForCoach || checkIn.additionalNotes) && (
              <Card>
                {checkIn.wins && <Section label="Wins"><TextBlock text={checkIn.wins} /></Section>}
                {checkIn.struggles && <Section label="Struggles"><TextBlock text={checkIn.struggles} /></Section>}
                {checkIn.questionsForCoach && (
                  <Section label="Questions for You">
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: "#e8c98a", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{checkIn.questionsForCoach}</p>
                  </Section>
                )}
                {checkIn.additionalNotes && <Section label="Additional Notes"><TextBlock text={checkIn.additionalNotes} /></Section>}
              </Card>
            )}
          </div>
        </div>

        {/* Feedback composer (unchanged) */}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", flexWrap: "wrap", gap: 12 }}>
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
