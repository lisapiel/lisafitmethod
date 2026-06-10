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

// ── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  weight: string
  weightUnit: "LBS" | "KG"
  sleepQuality: number
  energyLevel: number
  hungerLevel: number
  stressLevel: number
  digestion: number
  trainingPerformance: number
  nutritionAdherence: number
  workoutConsistency: number
  wins: string
  struggles: string
  questionsForCoach: string
  additionalNotes: string
}

const INITIAL: FormState = {
  weight: "", weightUnit: "LBS",
  sleepQuality: 0, energyLevel: 0, hungerLevel: 0, stressLevel: 0, digestion: 0,
  trainingPerformance: 0, nutritionAdherence: 0, workoutConsistency: 0,
  wins: "", struggles: "", questionsForCoach: "", additionalNotes: "",
}

const STEPS = [
  "Body Metrics",
  "Wellbeing",
  "Training & Nutrition",
  "Reflection",
  "Submit",
]

// ── Helpers ──────────────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, string> = { 1: "Poor", 2: "Below avg", 3: "Average", 4: "Good", 5: "Excellent" }
const INVERSE_LABELS: Record<number, string> = { 1: "Very low", 2: "Low", 3: "Moderate", 4: "High", 5: "Very high" }

function RatingRow({
  label,
  value,
  onChange,
  inverse,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  inverse?: boolean
}) {
  const labels = inverse ? INVERSE_LABELS : RATING_LABELS
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black }}>{label}</label>
        {value > 0 && (
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: accent }}>{labels[value]}</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 6,
              border: `2px solid ${value === n ? accent : border}`,
              background: value === n ? accent : white,
              color: value === n ? black : muted,
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.1s",
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: "#bbb" }}>{labels[1]}</span>
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: "#bbb" }}>{labels[5]}</span>
      </div>
    </div>
  )
}

function TextBlock({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black, display: "block", marginBottom: 8 }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black,
          padding: "12px 14px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem",
          outline: "none", resize: "none", borderRadius: 6, boxSizing: "border-box", lineHeight: 1.5,
        }}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CheckInClient() {
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [, setWeightUnit] = useState<"LBS" | "KG">("LBS")
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const attrs = await fetchUserAttributes()
        const userEmail = attrs.email ?? ""
        setEmail(userEmail)

        const db = generateClient<Schema>({ authMode: "userPool" })

        // Get client's weight unit preference
        const { data: clients } = await db.models.CoachingClient.list({ authMode: "userPool" })
        const me = clients.find((c) => c.email.toLowerCase() === userEmail.toLowerCase())
        if (me?.weightUnit) {
          setWeightUnit(me.weightUnit as "LBS" | "KG")
          setForm((f) => ({ ...f, weightUnit: me.weightUnit as "LBS" | "KG" }))
        }

        // Check if already submitted this week
        const { data: checkIns } = await db.models.CoachingCheckIn.list({ authMode: "userPool" })
        const mine = checkIns.filter((ci) => ci.clientEmail.toLowerCase() === userEmail.toLowerCase())
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const recent = mine.find((ci) => new Date(ci.submittedAt) > weekAgo)
        if (recent) setAlreadySubmitted(true)
      } catch { /* layout handles auth */ }
      setLoading(false)
    }
    init()
  }, [])

  const set = <K extends keyof FormState>(key: K) => (val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  function canProceed() {
    if (step === 2) return form.sleepQuality > 0 && form.energyLevel > 0 && form.hungerLevel > 0 && form.stressLevel > 0
    if (step === 3) return form.trainingPerformance > 0 && form.nutritionAdherence > 0 && form.workoutConsistency > 0
    return true
  }

  async function submit() {
    setSaving(true)
    const db = generateClient<Schema>({ authMode: "userPool" })
    await db.models.CoachingCheckIn.create({
      clientEmail: email,
      submittedAt: new Date().toISOString(),
      status: "PENDING",
      weight: form.weight ? parseFloat(form.weight) : undefined,
      weightUnit: form.weightUnit,
      sleepQuality: form.sleepQuality || undefined,
      energyLevel: form.energyLevel || undefined,
      hungerLevel: form.hungerLevel || undefined,
      stressLevel: form.stressLevel || undefined,
      digestion: form.digestion || undefined,
      trainingPerformance: form.trainingPerformance || undefined,
      nutritionAdherence: form.nutritionAdherence || undefined,
      workoutConsistency: form.workoutConsistency || undefined,
      wins: form.wins || undefined,
      struggles: form.struggles || undefined,
      questionsForCoach: form.questionsForCoach || undefined,
      additionalNotes: form.additionalNotes || undefined,
    })
    setSaving(false)
    setSubmitted(true)
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div>
        <div style={{ background: white, border: `1px solid #c8e6c8`, borderRadius: 8, padding: "3rem 2rem", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0faf0", border: "2px solid #5c9e6a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M4.5 13l6 7L21.5 6" stroke="#5c9e6a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: "0 0 8px" }}>Check-in submitted!</h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 28px", lineHeight: 1.6 }}>
            Lisa will review your check-in and send feedback within 48 hours.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/my-coaching/check-in/history" style={{ display: "inline-block", background: accent, color: black, padding: "12px 24px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
              View Check-In History
            </Link>
            <Link href="/my-coaching" style={{ display: "inline-block", background: "transparent", color: muted, padding: "12px 20px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", textDecoration: "none", border: `1px solid ${border}`, borderRadius: 4 }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (alreadySubmitted) {
    return (
      <div>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, marginBottom: "0.5rem" }}>Weekly Check-In</h1>
        <div style={{ background: "#fdf9f5", border: `1px solid ${border}`, borderRadius: 8, padding: "2rem", textAlign: "center", maxWidth: 480 }}>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.2rem", color: black, margin: "0 0 8px" }}>Already submitted this week</p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 20px" }}>
            Your check-in is with Lisa. She&apos;ll send feedback soon.
          </p>
          <Link href="/my-coaching/check-in/history" style={{ display: "inline-block", background: accent, color: black, padding: "11px 24px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
            View History & Feedback
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>Weekly</p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, margin: 0 }}>Check-In</h1>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "2rem" }}>
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = n < step
          const active = n === step
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: active ? 32 : 24,
                  height: active ? 32 : 24,
                  borderRadius: "50%",
                  background: done ? accent : active ? black : border,
                  border: `2px solid ${done ? accent : active ? black : border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  {done ? (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: active ? "0.75rem" : "0.6rem", fontWeight: 700, color: active ? white : muted }}>{n}</span>
                  )}
                </div>
                {active && <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 600, color: black, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{label}</span>}
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: n < step ? accent : border, width: 20, borderRadius: 1 }} />}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.75rem" }}>

        {/* Step 1: Body Metrics */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>Body Metrics</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 1.5rem" }}>This is optional but helps Lisa track your progress over time.</p>

            <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black, display: "block", marginBottom: 8 }}>Current Weight</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="text"
                inputMode="decimal"
                value={form.weight}
                onChange={(e) => set("weight")(e.target.value)}
                placeholder="e.g. 68.5"
                style={{ flex: 1, background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "12px 14px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", fontWeight: 600, outline: "none", borderRadius: 6 }}
              />
              {(["LBS", "KG"] as const).map((u) => (
                <button key={u} onClick={() => { set("weightUnit")(u); setWeightUnit(u) }}
                  style={{ background: form.weightUnit === u ? accent : white, border: `2px solid ${form.weightUnit === u ? accent : border}`, color: form.weightUnit === u ? black : muted, padding: "12px 16px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Wellbeing */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>How are you feeling?</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 1.5rem" }}>Rate each area this past week. 1 = poor, 5 = excellent.</p>
            <RatingRow label="Sleep quality" value={form.sleepQuality} onChange={set("sleepQuality")} />
            <RatingRow label="Energy levels" value={form.energyLevel} onChange={set("energyLevel")} />
            <RatingRow label="Hunger / appetite" value={form.hungerLevel} onChange={set("hungerLevel")} inverse />
            <RatingRow label="Stress levels" value={form.stressLevel} onChange={set("stressLevel")} inverse />
          </div>
        )}

        {/* Step 3: Training & Nutrition */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>Training & Nutrition</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 1.5rem" }}>How did you do this week?</p>
            <RatingRow label="Training performance" value={form.trainingPerformance} onChange={set("trainingPerformance")} />
            <RatingRow label="Nutrition adherence" value={form.nutritionAdherence} onChange={set("nutritionAdherence")} />
            <RatingRow label="Workout consistency" value={form.workoutConsistency} onChange={set("workoutConsistency")} />
            <RatingRow label="Digestion" value={form.digestion} onChange={set("digestion")} />
          </div>
        )}

        {/* Step 4: Reflection */}
        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>Weekly Reflection</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 1.5rem" }}>Share your highs, lows, and anything you want Lisa to know.</p>
            <TextBlock label="Wins this week 🎉" value={form.wins} onChange={set("wins")} placeholder="What went well? Any PRs, habits you're proud of, moments of progress..." />
            <TextBlock label="Struggles this week" value={form.struggles} onChange={set("struggles")} placeholder="What felt hard? Missed workouts, cravings, low energy days..." />
            <TextBlock label="Questions for Lisa" value={form.questionsForCoach} onChange={set("questionsForCoach")} placeholder="Anything you want to ask or clarify about your program..." />
          </div>
        )}

        {/* Step 5: Submit */}
        {step === 5 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>Anything else?</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 1.5rem" }}>Optional — any other notes before you submit.</p>
            <TextBlock label="Additional notes" value={form.additionalNotes} onChange={set("additionalNotes")} placeholder="Injuries, lifestyle changes, upcoming events that might affect training..." />

            {/* Summary */}
            <div style={{ background: "#faf8f5", border: `1px solid ${border}`, borderRadius: 6, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 10px" }}>Summary</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
                {[
                  ["Weight", form.weight ? `${form.weight} ${form.weightUnit}` : "—"],
                  ["Sleep", form.sleepQuality ? `${form.sleepQuality}/5` : "—"],
                  ["Energy", form.energyLevel ? `${form.energyLevel}/5` : "—"],
                  ["Training", form.trainingPerformance ? `${form.trainingPerformance}/5` : "—"],
                  ["Nutrition", form.nutritionAdherence ? `${form.nutritionAdherence}/5` : "—"],
                  ["Consistency", form.workoutConsistency ? `${form.workoutConsistency}/5` : "—"],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: black }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
          {step > 1 ? (
            <button onClick={() => setStep((s) => s - 1)} style={{ background: "none", border: `1px solid ${border}`, color: muted, padding: "11px 24px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", borderRadius: 4 }}>
              ← Back
            </button>
          ) : (
            <Link href="/my-coaching" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, textDecoration: "none" }}>Cancel</Link>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              style={{ background: canProceed() ? black : "#ddd", color: canProceed() ? white : "#aaa", border: "none", padding: "11px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: canProceed() ? "pointer" : "not-allowed", borderRadius: 4 }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={saving}
              style={{ background: saving ? "#ccc" : accent, color: black, border: "none", padding: "11px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: saving ? "wait" : "pointer", borderRadius: 4 }}
            >
              {saving ? "Submitting…" : "Submit Check-In"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
