"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

type FormReview = { exercise: string; note: string; videoKeys: string[] }

type CheckIn = {
  id: string
  submittedAt: string
  status: "PENDING" | "REVIEWED" | null
  schemaVersion: number | null
  // Progress
  weight: number | null
  weightUnit: string | null
  measurementSnapshot: string | null
  // Legacy 1–5 ratings + text
  sleepQuality: number | null
  energyLevel: number | null
  trainingPerformance: number | null
  nutritionAdherence: number | null
  workoutConsistency: number | null
  wins: string | null
  struggles: string | null
  questionsForCoach: string | null
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
  // v2 — Recovery (sleep/energy reuse legacy; stress/recovery are new for v2)
  stressLevel: number | null
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
      <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", color: muted, textAlign: "center", maxWidth: 60 }}>{label}</span>
    </div>
  )
}

function TextSection({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: black, lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>{text}</p>
    </div>
  )
}

function Chip({ label, tone = "info" }: { label: string; tone?: "attention" | "info" }) {
  const bg = tone === "attention" ? "#fbeaea" : `${accent}18`
  const fg = tone === "attention" ? "#a63030" : "#8e6c30"
  const bd = tone === "attention" ? "#f3c8c8" : `${accent}55`
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: bg, color: fg, border: `1px solid ${bd}`,
      padding: "4px 10px", borderRadius: 999,
      fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.04em",
    }}>{label}</span>
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
        const res = await fetch("/api/coaching/check-in")
        if (res.ok) {
          const data = await res.json()
          const mapped: CheckIn[] = (data.checkIns ?? []).map((ci: Record<string, unknown>) => {
            let formReviews: FormReview[] = []
            try {
              if (typeof ci.formReviews === "string" && ci.formReviews) {
                const raw = JSON.parse(ci.formReviews) as unknown[]
                formReviews = raw.map((r) => {
                  const rr = r as Record<string, unknown>
                  return {
                    exercise: String(rr.exercise ?? ""),
                    note: String(rr.note ?? ""),
                    videoKeys: Array.isArray(rr.videoKeys)
                      ? (rr.videoKeys as unknown[]).filter((k): k is string => typeof k === "string")
                      : [],
                  }
                })
              }
            } catch { /* keep empty */ }
            const adjustmentAreas: string[] = typeof ci.adjustmentAreas === "string" && ci.adjustmentAreas
              ? ci.adjustmentAreas.split(",").map((s: string) => s.trim()).filter(Boolean)
              : []
            return {
              id: ci.id as string,
              submittedAt: ci.submittedAt as string,
              status: (ci.status ?? "PENDING") as CheckIn["status"],
              schemaVersion: ci.schemaVersion != null ? Number(ci.schemaVersion) : null,
              weight: ci.weight != null ? Number(ci.weight) : null,
              weightUnit: (ci.weightUnit as string | null) ?? null,
              measurementSnapshot: (ci.measurementSnapshot as string | null) ?? null,
              sleepQuality: ci.sleepQuality != null ? Number(ci.sleepQuality) : null,
              energyLevel: ci.energyLevel != null ? Number(ci.energyLevel) : null,
              trainingPerformance: ci.trainingPerformance != null ? Number(ci.trainingPerformance) : null,
              nutritionAdherence: ci.nutritionAdherence != null ? Number(ci.nutritionAdherence) : null,
              workoutConsistency: ci.workoutConsistency != null ? Number(ci.workoutConsistency) : null,
              wins: (ci.wins as string | null) ?? null,
              struggles: (ci.struggles as string | null) ?? null,
              questionsForCoach: (ci.questionsForCoach as string | null) ?? null,
              workoutsCompleted: ci.workoutsCompleted != null ? Number(ci.workoutsCompleted) : null,
              workoutsPlanned: ci.workoutsPlanned != null ? Number(ci.workoutsPlanned) : null,
              trainingRating: ci.trainingRating != null ? Number(ci.trainingRating) : null,
              trainingWins: (ci.trainingWins as string | null) ?? null,
              trainingChallenges: (ci.trainingChallenges as string | null) ?? null,
              painReported: typeof ci.painReported === "boolean" ? ci.painReported : null,
              painNotes: (ci.painNotes as string | null) ?? null,
              formReviewRequested: typeof ci.formReviewRequested === "boolean" ? ci.formReviewRequested : null,
              formReviews,
              stressLevel: ci.stressLevel != null ? Number(ci.stressLevel) : null,
              recoveryRating: ci.recoveryRating != null ? Number(ci.recoveryRating) : null,
              nutritionStatus: (ci.nutritionStatus as string | null) ?? null,
              nutritionHelp: (ci.nutritionHelp as string | null) ?? null,
              weeklyWin: (ci.weeklyWin as string | null) ?? null,
              weeklyChallenge: (ci.weeklyChallenge as string | null) ?? null,
              adjustmentAreas,
              adjustmentNotes: (ci.adjustmentNotes as string | null) ?? null,
              questionForLisa: (ci.questionForLisa as string | null) ?? null,
              coachFeedback: (ci.coachFeedback as string | null) ?? null,
              reviewedAt: (ci.reviewedAt as string | null) ?? null,
            }
          })
          setCheckIns(mapped)
          if (mapped.length > 0) setExpanded(mapped[0].id)
        }
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
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.6rem, 5.5vw, 2rem)", fontWeight: 700, color: black, margin: 0 }}>Check-In History</h1>
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
            const isV2 = ci.schemaVersion === 2
            return (
              <div key={ci.id} style={{ background: white, border: `1px solid ${reviewed ? "#d4e8d4" : border}`, borderRadius: 8, overflow: "hidden" }}>
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : ci.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: reviewed ? "#5c9e6a" : accent, flexShrink: 0 }} />
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
                    {isV2 ? <V2Body ci={ci} /> : <LegacyBody ci={ci} />}

                    {/* Lisa's feedback + awaiting state — shared across both schemas */}
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
                        Awaiting feedback from Lisa.
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

// ── v2 body: concise summary of the new fields ─────────────────────────────

function V2Body({ ci }: { ci: CheckIn }) {
  // Attention/info chips at the top so a scan of history highlights weeks
  // that had pain, form-review requests, adjustment asks, or questions.
  const meaningfulAdjustments = ci.adjustmentAreas.filter((a) => a !== "none")
  const videoCount = ci.formReviews.reduce((n, r) => n + r.videoKeys.length, 0)
  const chips: Array<{ label: string; tone: "attention" | "info" }> = []
  if (ci.painReported === true) chips.push({ label: "Pain / discomfort reported", tone: "attention" })
  if (ci.formReviewRequested === true) {
    chips.push({ label: `Form review submitted${videoCount > 0 ? ` · ${videoCount} video${videoCount === 1 ? "" : "s"}` : ""}`, tone: "info" })
  }
  if (meaningfulAdjustments.length > 0) chips.push({ label: "Program adjustment requested", tone: "info" })
  if (ci.questionForLisa && ci.questionForLisa.trim()) chips.push({ label: "Question for Lisa", tone: "info" })

  const hasAnyMeasurements = (() => {
    if (!ci.measurementSnapshot) return false
    try { return (JSON.parse(ci.measurementSnapshot) as unknown[]).length > 0 } catch { return false }
  })()

  const hasRecovery = ci.sleepQuality || ci.energyLevel || ci.stressLevel || ci.recoveryRating

  return (
    <div>
      {chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
          {chips.map((c) => <Chip key={c.label} label={c.label} tone={c.tone} />)}
        </div>
      )}

      {/* Training summary line */}
      {ci.workoutsCompleted != null && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>Training</p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", color: black, margin: 0, fontWeight: 600 }}>
            {ci.workoutsPlanned != null
              ? `${ci.workoutsCompleted} of ${ci.workoutsPlanned} planned workouts completed`
              : `${ci.workoutsCompleted} workout${ci.workoutsCompleted === 1 ? "" : "s"} completed`}
            {ci.trainingRating != null && (
              <span style={{ color: muted, fontWeight: 500 }}> · Feel {ci.trainingRating}/5</span>
            )}
          </p>
        </div>
      )}

      {/* Measurements — count only, keeps card compact */}
      {hasAnyMeasurements && (
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, margin: "0 0 1rem" }}>
          <span style={{ color: black, fontWeight: 600 }}>{JSON.parse(ci.measurementSnapshot!).length}</span> measurement{JSON.parse(ci.measurementSnapshot!).length === 1 ? "" : "s"} logged
        </p>
      )}

      {hasRecovery && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 6px" }}>Recovery</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <RatingBadge label="Sleep" value={ci.sleepQuality} />
            <RatingBadge label="Energy" value={ci.energyLevel} />
            <RatingBadge label="Stress mgmt" value={ci.stressLevel} />
            <RatingBadge label="Recovery" value={ci.recoveryRating} />
          </div>
        </div>
      )}

      {ci.trainingWins && <TextSection label="What felt good" text={ci.trainingWins} />}
      {ci.trainingChallenges && <TextSection label="Didn't enjoy / wanted changed" text={ci.trainingChallenges} />}

      {ci.painReported === true && ci.painNotes && (
        <TextSection label="Pain / discomfort" text={ci.painNotes} />
      )}

      {ci.formReviewRequested === true && ci.formReviews.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 6px" }}>Form review</p>
          <ul style={{ margin: 0, paddingLeft: "1.1rem", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: black, lineHeight: 1.55 }}>
            {ci.formReviews.map((r, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {r.exercise ? <strong>{r.exercise}</strong> : <span style={{ fontStyle: "italic", color: muted }}>Unnamed exercise</span>}
                {r.note && <>: <span style={{ color: muted }}>&ldquo;{r.note}&rdquo;</span></>}
                {r.videoKeys.length > 0 && (
                  <span style={{ color: muted, fontSize: "0.75rem" }}> · {r.videoKeys.length} video{r.videoKeys.length === 1 ? "" : "s"}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(ci.nutritionStatus || ci.nutritionHelp) && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>Nutrition</p>
          {ci.nutritionStatus && (
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: black, margin: "0 0 4px", fontWeight: 600 }}>
              {NUTRITION_STATUS_LABEL[ci.nutritionStatus] ?? ci.nutritionStatus}
            </p>
          )}
          {ci.nutritionHelp && <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: black, lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>{ci.nutritionHelp}</p>}
        </div>
      )}

      {ci.weeklyWin && <TextSection label="Biggest win" text={ci.weeklyWin} />}
      {ci.weeklyChallenge && <TextSection label="Biggest challenge" text={ci.weeklyChallenge} />}

      {meaningfulAdjustments.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 6px" }}>Wanted adjusted</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: ci.adjustmentNotes ? 6 : 0 }}>
            {meaningfulAdjustments.map((a) => <Chip key={a} label={ADJUSTMENT_LABEL[a] ?? a} tone="info" />)}
          </div>
          {ci.adjustmentNotes && (
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: black, lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>{ci.adjustmentNotes}</p>
          )}
        </div>
      )}

      {ci.questionForLisa && <TextSection label="Question for Lisa" text={ci.questionForLisa} />}
    </div>
  )
}

// ── Legacy body: same UI the old renderer produced ─────────────────────────

function LegacyBody({ ci }: { ci: CheckIn }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <RatingBadge label="Sleep" value={ci.sleepQuality} />
        <RatingBadge label="Energy" value={ci.energyLevel} />
        <RatingBadge label="Training" value={ci.trainingPerformance} />
        <RatingBadge label="Nutrition" value={ci.nutritionAdherence} />
        <RatingBadge label="Consistency" value={ci.workoutConsistency} />
      </div>

      {ci.wins && <TextSection label="Wins" text={ci.wins} />}
      {ci.struggles && <TextSection label="Struggles" text={ci.struggles} />}
      {ci.questionsForCoach && <TextSection label="Questions for Lisa" text={ci.questionsForCoach} />}
    </div>
  )
}
