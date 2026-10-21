"use client"

import { useState, useEffect } from "react"

// The 1:1 coaching application.
//
// Moved out of src/app/coaching/page.client.tsx unchanged so the Direction D
// coaching page submits through exactly the same code: the same seventeen
// fields, the same member-access prefill, the same debounced bundle-credit
// lookup, and the same POST of the whole form object to /api/coaching/apply.
// None of the application logic is reimplemented anywhere.
//
// The form carries its own stylesheet, so a page that renders it supplies
// none of that. Direction D restyles it by overriding these classes rather
// than by forking the form.

const ACCENT = "#c8a97e"
const ACCENT_DARK = "#a8895e"
const TEXT = "#1a1a1a"
const MUTED = "#6b6560"

interface FormState {
  name: string
  email: string
  primaryGoal: string
  primaryGoalOther: string
  specificOutcome: string
  trainingExperience: string
  currentTraining: string
  daysPerWeek: string
  sessionDuration: string
  equipment: string
  equipmentDetails: string
  injuries: string
  exercisePreferences: string
  scheduleConstraints: string
  whyCoachingNow: string
  coachingOption: string
  startTiming: string
}

const emptyForm: FormState = {
  name: "",
  email: "",
  primaryGoal: "",
  primaryGoalOther: "",
  specificOutcome: "",
  trainingExperience: "",
  currentTraining: "",
  daysPerWeek: "",
  sessionDuration: "",
  equipment: "",
  equipmentDetails: "",
  injuries: "",
  exercisePreferences: "",
  scheduleConstraints: "",
  whyCoachingNow: "",
  coachingOption: "",
  startTiming: "",
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.12)",
  padding: "13px 16px",
  fontSize: 15,
  fontFamily: "var(--font-dm-sans), sans-serif",
  color: TEXT,
  outline: "none",
  boxSizing: "border-box",
  borderRadius: 0,
  appearance: "none",
  WebkitAppearance: "none",
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: "var(--text-eyebrow)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, marginBottom: 6 }}>
      {children}
    </label>
  )
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "var(--text-small)", color: MUTED, margin: "-2px 0 6px", lineHeight: 1.5 }}>
      {children}
    </p>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "var(--text-eyebrow)",
      fontWeight: 700,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color: ACCENT_DARK,
      margin: "8px 0 4px",
      paddingBottom: 10,
      borderBottom: "1px solid rgba(0,0,0,0.08)",
    }}>
      {children}
    </p>
  )
}

export function CoachingApplicationForm() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")

  useEffect(() => {
    fetch("/api/member/access")
      .then((r) => r.json())
      .then((d: { email?: string }) => {
        if (d.email) setForm((f) => ({ ...f, email: d.email! }))
      })
      .catch(() => {})
  }, [])

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // Bundle-credit lookup — debounced by email input. Shows a banner if the
  // applicant's email matches a bundle purchase within the credit window.
  const [bundleCredit, setBundleCredit] = useState<{ available: boolean; amountCents: number; expiresAt: string | null } | null>(null)
  useEffect(() => {
    const email = form.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setBundleCredit(null); return }
    const timeout = setTimeout(() => {
      fetch(`/api/coaching/bundle-credit?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((d: { available?: boolean; amountCents?: number; expiresAt?: string | null }) => {
          if (d.available) setBundleCredit({ available: true, amountCents: d.amountCents ?? 0, expiresAt: d.expiresAt ?? null })
          else setBundleCredit(null)
        })
        .catch(() => setBundleCredit(null))
    }, 400)
    return () => clearTimeout(timeout)
  }, [form.email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/coaching/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { ok: boolean }
      setStatus(data.ok ? "done" : "error")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="ch-form-root">
      <style>{`
        .ch-2col-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 900px) { .ch-2col-form { grid-template-columns: 1fr; } }
        .ch-btn-primary {
          display: inline-block;
          background: ${ACCENT};
          color: #0a0a0a;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: var(--text-small);
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          padding: clamp(1rem, 1.1vw, 1.125rem) clamp(2rem, 2.5vw, 2.75rem);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ch-btn-primary:hover { background: ${ACCENT_DARK}; }
        .ch-input:focus  { border-color: ${ACCENT} !important; }
        .ch-select-wrap  { position: relative; }
        .ch-select-wrap::after {
          content: '';
          position: absolute;
          right: 14px; top: 50%; transform: translateY(-50%);
          border: 4px solid transparent;
          border-top-color: ${MUTED};
          pointer-events: none;
        }
      `}</style>
              {status === "done" ? (
                <div style={{ background: "#0a0a0a", padding: "52px 44px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 30, fontWeight: 700, color: ACCENT, marginBottom: 16 }}>Got it — thank you.</p>
                  <p style={{ fontSize: "var(--text-body)", color: "rgba(240,230,211,0.6)", lineHeight: 1.7 }}>
                    Your application has been received. I&apos;ll be in touch within 48 hours. Check your inbox (and spam just in case).
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* ── YOUR GOALS ─────────────────────────────────────── */}
                  <SectionHeading>Your goals</SectionHeading>

                  <div className="ch-2col-form">
                    <div>
                      <Label>Full name *</Label>
                      <input required type="text" value={form.name} onChange={set("name")} style={inputBase} className="ch-input" />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <input required type="email" value={form.email} onChange={set("email")} style={inputBase} className="ch-input" />
                    </div>
                  </div>

                  <div>
                    <Label>What is your primary goal? *</Label>
                    <div className="ch-select-wrap">
                      <select required value={form.primaryGoal} onChange={set("primaryGoal")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                        <option value="">Select…</option>
                        <option>Build muscle</option>
                        <option>Lose fat</option>
                        <option>Body recomposition</option>
                        <option>Build strength</option>
                        <option>Improve a specific skill / performance goal</option>
                        <option>Improve mobility / movement</option>
                        <option>Return to training / work around limitations</option>
                        <option>General fitness &amp; health</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  {form.primaryGoal === "Other" && (
                    <div>
                      <Label>What is your primary goal? *</Label>
                      <input required type="text" value={form.primaryGoalOther} onChange={set("primaryGoalOther")} placeholder="In a few words…" style={inputBase} className="ch-input" />
                    </div>
                  )}

                  <div>
                    <Label>What would you most like to achieve over the next few months? *</Label>
                    <HelperText>Tell me what success would look like for you.</HelperText>
                    <textarea required rows={3} value={form.specificOutcome} onChange={set("specificOutcome")} style={{ ...inputBase, resize: "vertical" }} className="ch-input" />
                  </div>

                  {/* ── YOUR TRAINING ──────────────────────────────────── */}
                  <SectionHeading>Your training</SectionHeading>

                  <div>
                    <Label>How long have you been training? *</Label>
                    <div className="ch-select-wrap">
                      <select required value={form.trainingExperience} onChange={set("trainingExperience")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                        <option value="">Select…</option>
                        <option>I&apos;m new to structured training</option>
                        <option>Less than 6 months</option>
                        <option>6–12 months</option>
                        <option>1–2 years</option>
                        <option>3–5 years</option>
                        <option>5+ years</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>What does your training look like right now? *</Label>
                    <HelperText>What are you currently doing, how often are you training, and what does a typical week look like?</HelperText>
                    <textarea required rows={3} value={form.currentTraining} onChange={set("currentTraining")} style={{ ...inputBase, resize: "vertical" }} className="ch-input" />
                  </div>

                  <div className="ch-2col-form">
                    <div>
                      <Label>How many days per week do you realistically want to train? *</Label>
                      <div className="ch-select-wrap">
                        <select required value={form.daysPerWeek} onChange={set("daysPerWeek")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                          <option value="">Select…</option>
                          <option>2</option>
                          <option>3</option>
                          <option>4</option>
                          <option>5</option>
                          <option>6</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>How much time can you realistically spend on each workout? *</Label>
                      <div className="ch-select-wrap">
                        <select required value={form.sessionDuration} onChange={set("sessionDuration")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                          <option value="">Select…</option>
                          <option>30 min</option>
                          <option>45 min</option>
                          <option>60 min</option>
                          <option>75 min</option>
                          <option>90+ min</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ── YOUR SETUP ─────────────────────────────────────── */}
                  <SectionHeading>Your setup</SectionHeading>

                  <div>
                    <Label>Where will you do most of your training? *</Label>
                    <div className="ch-select-wrap">
                      <select required value={form.equipment} onChange={set("equipment")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                        <option value="">Select…</option>
                        <option>Full commercial gym</option>
                        <option>Apartment / condo gym</option>
                        <option>Home gym with rack, barbell &amp; plates</option>
                        <option>Dumbbells + bench</option>
                        <option>Dumbbells only</option>
                        <option>Minimal equipment / bodyweight</option>
                        <option>Other / limited setup</option>
                      </select>
                    </div>
                  </div>

                  {form.equipment && form.equipment !== "Full commercial gym" && (
                    <div>
                      <Label>
                        Anything I should know about your equipment?{form.equipment === "Other / limited setup" ? " *" : ""}
                      </Label>
                      <textarea
                        required={form.equipment === "Other / limited setup"}
                        rows={2}
                        value={form.equipmentDetails}
                        onChange={set("equipmentDetails")}
                        placeholder={form.equipment === "Other / limited setup" ? "What do you have to work with?" : "Optional — brands, weight ranges, missing pieces, etc."}
                        style={{ ...inputBase, resize: "vertical" }}
                        className="ch-input"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Any current or past injuries, pain, movement limitations, or exercises that bother you? *</Label>
                    <textarea required rows={3} value={form.injuries} onChange={set("injuries")} placeholder="None, or describe…" style={{ ...inputBase, resize: "vertical" }} className="ch-input" />
                  </div>

                  <div>
                    <Label>Any exercises you love, hate, or would prefer to include or avoid?</Label>
                    <textarea rows={2} value={form.exercisePreferences} onChange={set("exercisePreferences")} placeholder="Optional" style={{ ...inputBase, resize: "vertical" }} className="ch-input" />
                  </div>

                  <div>
                    <Label>Anything about your schedule I should know?</Label>
                    <textarea rows={2} value={form.scheduleConstraints} onChange={set("scheduleConstraints")} placeholder="Optional — travel, days you can't train, rotating shifts, etc." style={{ ...inputBase, resize: "vertical" }} className="ch-input" />
                  </div>

                  {/* ── COACHING ───────────────────────────────────────── */}
                  <SectionHeading>Coaching</SectionHeading>

                  <div>
                    <Label>What made you decide to look for coaching right now? *</Label>
                    <HelperText>What do you feel you need the most help with?</HelperText>
                    <textarea required rows={3} value={form.whyCoachingNow} onChange={set("whyCoachingNow")} style={{ ...inputBase, resize: "vertical" }} className="ch-input" />
                  </div>

                  <div>
                    <Label>Which coaching option are you most interested in? *</Label>
                    <div className="ch-select-wrap">
                      <select required value={form.coachingOption} onChange={set("coachingOption")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                        <option value="">Select…</option>
                        <option>3-month coaching — $397/month</option>
                        <option>Month-to-month coaching — $497/month</option>
                        <option>I&apos;m not sure yet</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label>How soon do you want to start? *</Label>
                    <div className="ch-select-wrap">
                      <select required value={form.startTiming} onChange={set("startTiming")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                        <option value="">Select…</option>
                        <option>Now</option>
                        <option>Within a month</option>
                        <option>Just exploring</option>
                      </select>
                    </div>
                  </div>

                  {status === "error" && (
                    <p style={{ fontSize: "var(--text-small)", color: "#c0392b", lineHeight: 1.5 }}>Something went wrong. Please try again or reach out on Instagram.</p>
                  )}

                  {bundleCredit?.available && (
                    <div
                      style={{
                        background: `${ACCENT}18`,
                        border: `1px solid ${ACCENT}`,
                        borderLeft: `4px solid ${ACCENT}`,
                        padding: "12px 14px",
                        borderRadius: 4,
                      }}
                    >
                      <p style={{ fontSize: "var(--text-eyebrow)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT, margin: "0 0 4px" }}>
                        Bundle credit found ✓
                      </p>
                      <p style={{ fontSize: "var(--text-small)", color: TEXT, margin: 0, lineHeight: 1.5 }}>
                        Choose the <strong>3-month coaching option</strong> below and your <strong>${(bundleCredit.amountCents / 100).toFixed(0)}</strong> bundle credit will be applied to your first coaching month. Month-to-month coaching isn&apos;t eligible for the bundle credit.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="ch-btn-primary"
                    style={{ width: "100%", opacity: status === "sending" ? 0.6 : 1, fontSize: "var(--text-small)" }}
                  >
                    {status === "sending" ? "Sending…" : "Submit Application"}
                  </button>
                </form>
              )}
    </div>
  )
}
