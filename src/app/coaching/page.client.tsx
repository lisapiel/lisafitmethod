"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

const ACCENT = "#c8a97e"
const ACCENT_DARK = "#a8895e"
const CREAM = "#faf8f5"
const TEXT = "#1a1a1a"
const MUTED = "#6b6560"
const BORDER = "rgba(0,0,0,0.08)"

// ─── Inline SVG icons ────────────────────────────────────────────────────────

function IconBarbell() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="9" y="12" width="10" height="4" rx="1" />
      <line x1="4" y1="14" x2="9" y2="14" />
      <line x1="19" y1="14" x2="24" y2="14" />
      <rect x="2" y="11" width="2" height="6" rx="0.5" />
      <rect x="24" y="11" width="2" height="6" rx="0.5" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-5 4V7a1 1 0 0 1 1-1z" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4l8 3v7c0 4-3.5 7.5-8 9-4.5-1.5-8-5-8-9V7l8-3z" />
    </svg>
  )
}

function IconTarget() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="14" cy="14" r="9" />
      <circle cx="14" cy="14" r="5" />
      <circle cx="14" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="4" width="18" height="16" rx="2" />
      <line x1="7" y1="2" x2="7" y2="6" />
      <line x1="15" y1="2" x2="15" y2="6" />
      <line x1="2" y1="9" x2="20" y2="9" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="9" />
      <path d="M9 8l6 3-6 3V8z" />
    </svg>
  )
}

function IconMessage() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-4 3V5a1 1 0 0 1 1-1z" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 3h7v16H4z" />
      <path d="M11 3l7 2v14l-7-2V3z" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <polyline points="3,8 7,12 13,4" />
    </svg>
  )
}

function IconFlash() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4l-7 12h7l-1 8 7-12h-7l1-8z" />
    </svg>
  )
}

function IconFigure() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="14" cy="7" r="3" />
      <path d="M8 14c0-3 2.5-5 6-5s6 2 6 5v5h-3l-1 5h-4l-1-5H8v-5z" />
    </svg>
  )
}

function IconArrows() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14h20M18 8l6 6-6 6" />
      <path d="M4 8C4 8 8 11 10 14s6 6 6 6" />
    </svg>
  )
}

function IconLeaf() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 22c2-6 6-10 16-12C22 18 16 22 6 22z" />
      <path d="M6 22l6-6" />
    </svg>
  )
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  email: string
  trainingExperience: string
  primaryGoal: string
  whyNow: string
  daysPerWeek: string
  equipment: string
  injuries: string
  coursesCompleted: string
  coachingOption: string
  whyLisa: string
}

const emptyForm: FormState = {
  name: "",
  email: "",
  trainingExperience: "",
  primaryGoal: "",
  whyNow: "",
  daysPerWeek: "",
  equipment: "",
  injuries: "",
  coursesCompleted: "",
  coachingOption: "",
  whyLisa: "",
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
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, marginBottom: 6 }}>
      {children}
    </label>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CoachingClient() {
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
    <main style={{ background: CREAM, color: TEXT, fontFamily: "var(--font-dm-sans), sans-serif", overflowX: "hidden" }}>
      <style>{`
        .ch-hero      { padding: 96px 64px 80px; }
        .ch-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; max-width: 1160px; margin: 0 auto; }
        .ch-section   { padding: 100px 64px; }
        .ch-narrow    { max-width: 1160px; margin: 0 auto; }
        .ch-2col      { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
        .ch-4col      { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
        .ch-3col      { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .ch-2col-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .ch-portal-wrap { display: flex; flex-direction: column; gap: 20px; align-items: center; }
        .ch-phones    { display: flex; gap: 16px; justify-content: center; }

        @media (max-width: 900px) {
          .ch-hero      { padding: 80px 28px 64px; }
          .ch-hero-grid { grid-template-columns: 1fr; gap: 48px; }
          .ch-hero-photo-wrap { order: -1; }
          .ch-section   { padding: 72px 28px; }
          .ch-2col      { grid-template-columns: 1fr; gap: 48px; }
          .ch-4col      { grid-template-columns: repeat(2, 1fr); }
          .ch-3col      { grid-template-columns: 1fr; }
          .ch-2col-form { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .ch-4col      { grid-template-columns: 1fr; }
          .ch-phones    { flex-direction: column; align-items: center; }
        }

        .ch-btn-primary {
          display: inline-block;
          background: ${ACCENT};
          color: #0a0a0a;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 17px 36px;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ch-btn-primary:hover { background: ${ACCENT_DARK}; }
        .ch-btn-outline {
          display: inline-block;
          background: transparent;
          color: rgba(240,230,211,0.6);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          border: 1px solid rgba(240,230,211,0.2);
          padding: 16px 28px;
          transition: border-color 0.2s, color 0.2s;
        }
        .ch-btn-outline:hover { border-color: ${ACCENT}; color: ${ACCENT}; }
        .ch-link {
          font-size: 14px;
          color: ${ACCENT_DARK};
          text-decoration: none;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s;
        }
        .ch-link:hover { color: ${ACCENT}; }
        .ch-step-num {
          width: 40px; height: 40px; border-radius: 50%;
          background: transparent;
          border: 1px solid ${ACCENT};
          color: ${ACCENT};
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-playfair), serif;
          font-size: 17px;
          flex-shrink: 0;
        }
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

      {/* ── SECTION 1: HERO ──────────────────────────────────────────────── */}
      <section style={{ background: "#0a0a0a" }} className="ch-hero">
        <div className="ch-hero-grid">

          {/* Text left */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: ACCENT, marginBottom: 24 }}>
              Online 1:1 Coaching
            </p>
            <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(38px,4.5vw,62px)", fontWeight: 900, color: "#f5f2ee", lineHeight: 1.08, marginBottom: 28 }}>
              Stronger body.<br />
              <span style={{ color: ACCENT }}>Better movement. For life.</span>
            </h1>
            <p style={{ fontSize: 17, color: "rgba(240,230,211,0.65)", lineHeight: 1.7, marginBottom: 40, maxWidth: 520 }}>
              Personalized 1:1 coaching for people who want to build strength, improve their body composition, move better, and stay consistent — without the guesswork.
            </p>
            <p style={{ fontSize: 16, color: "rgba(240,230,211,0.5)", lineHeight: 1.7, marginBottom: 48, maxWidth: 520 }}>
              Every program is built around you, adapts as you progress, and keeps you accountable every step of the way.
            </p>

            {/* 4 benefit icons */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px 32px", marginBottom: 48 }}>
              {[
                { icon: <IconBarbell />, label: "Personalized programming" },
                { icon: <IconChat />, label: "Real accountability and feedback" },
                { icon: <IconShield />, label: "Injury-aware and adaptive" },
                { icon: <IconTarget />, label: "Long-term results" },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(240,230,211,0.55)" }}>
                  <span style={{ color: ACCENT, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <a href="#apply" className="ch-btn-primary">Apply for 1:1 Coaching</a>
              <a href="#experience" className="ch-btn-outline">Learn more ↓</a>
            </div>
          </div>

          {/* Photo right */}
          <div className="ch-hero-photo-wrap" style={{ position: "relative" }}>
            {/* PHOTO: save /public/lisa-coaching-hero.jpg (portrait — smiling/standing pose) */}
            <div style={{ position: "relative", height: 600, background: "#1a1a1a", overflow: "hidden" }}>
              <Image
                src="/lisa-coaching-hero.jpg"
                alt="Lisa McPherson, certified personal trainer"
                fill
                style={{ objectFit: "cover", objectPosition: "top center" }}
                priority
              />
            </div>
            {/* Quote card */}
            <div style={{
              position: "absolute", bottom: 32, left: -24, right: 24,
              background: "rgba(10,10,10,0.92)", backdropFilter: "blur(8px)",
              padding: "24px 28px", borderLeft: `3px solid ${ACCENT}`,
            }}>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 15, color: "rgba(240,230,211,0.85)", fontStyle: "italic", lineHeight: 1.65, margin: "0 0 12px" }}>
                &ldquo;I&apos;ve been through injuries. I know how frustrating it is. That&apos;s why my coaching is built to help you get stronger, move better, and train in a way your body can actually handle long term.&rdquo;
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", color: ACCENT, margin: 0 }}>— Lisa</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: EXPERIENCE ─────────────────────────────────────────── */}
      <section id="experience" className="ch-section" style={{ background: "#fff" }}>
        <div className="ch-narrow">
          <div className="ch-2col">
            {/* Text */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT_DARK, marginBottom: 16 }}>Your coaching experience</p>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px,3vw,42px)", fontWeight: 700, color: TEXT, lineHeight: 1.15, marginBottom: 16 }}>
                Everything you need in one place.
              </h2>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.7, marginBottom: 36 }}>
                Access your program on desktop or add it to your phone&apos;s home screen like an app.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
                {[
                  "Custom workouts with videos",
                  "Progress tracking",
                  "Weekly check-ins",
                  "Direct messaging",
                  "Goals and metrics",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <IconCheck />
                    <span style={{ fontSize: 15, color: TEXT, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
              <a href="#apply" className="ch-link">See how it works →</a>
            </div>

            {/* Portal screenshots */}
            <div className="ch-portal-wrap">
              {/* Desktop frame */}
              {/* SCREENSHOT: save /public/portal-desktop.jpg (screenshot of /my-coaching/workouts dashboard) */}
              <div style={{ width: "100%", background: "#1a1a1a", borderRadius: 8, padding: "12px 12px 0", boxShadow: "0 20px 48px rgba(0,0,0,0.15)" }}>
                <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                  {["#3a3a3a", "#3a3a3a", "#3a3a3a"].map((c, i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                  ))}
                </div>
                <div style={{ position: "relative", height: 220, background: "#f5f2ee", borderRadius: "4px 4px 0 0", overflow: "hidden" }}>
                  <Image
                    src="/portal-desktop.jpg"
                    alt="Lisa Fit Method coaching portal — desktop view"
                    fill
                    style={{ objectFit: "cover", objectPosition: "top left" }}
                  />
                </div>
              </div>

              {/* Two phones */}
              <div className="ch-phones">
                {/* SCREENSHOT: save /public/portal-mobile-program.jpg (mobile program/weeks overview) */}
                <div style={{ width: 148, background: "#1a1a1a", borderRadius: 20, padding: "14px 8px 8px", boxShadow: "0 16px 36px rgba(0,0,0,0.18)" }}>
                  <div style={{ position: "relative", height: 258, background: "#f5f2ee", borderRadius: 12, overflow: "hidden" }}>
                    <Image
                      src="/portal-mobile-program.jpg"
                      alt="Lisa Fit Method coaching portal — program overview on mobile"
                      fill
                      style={{ objectFit: "cover", objectPosition: "top" }}
                    />
                  </div>
                </div>
                {/* SCREENSHOT: save /public/portal-mobile-workout.jpg (mobile workout detail with exercises) */}
                <div style={{ width: 148, background: "#1a1a1a", borderRadius: 20, padding: "14px 8px 8px", boxShadow: "0 16px 36px rgba(0,0,0,0.18)" }}>
                  <div style={{ position: "relative", height: 258, background: "#f5f2ee", borderRadius: 12, overflow: "hidden" }}>
                    <Image
                      src="/portal-mobile-workout.jpg"
                      alt="Lisa Fit Method coaching portal — workout tracking on mobile"
                      fill
                      style={{ objectFit: "cover", objectPosition: "top" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: WHAT YOU'LL GET ────────────────────────────────────── */}
      <section className="ch-section" style={{ background: CREAM }}>
        <div className="ch-narrow">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT_DARK, marginBottom: 14 }}>What you&apos;ll get</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(26px,3vw,40px)", fontWeight: 700, color: TEXT, lineHeight: 1.2, margin: 0 }}>
              Results that go beyond how you look.
            </h2>
          </div>
          <div className="ch-4col">
            {[
              { icon: <IconFlash />, title: "Stronger, more capable", body: "You'll build real strength in your lifts and in your daily life." },
              { icon: <IconFigure />, title: "Improve body composition", body: "Build muscle, lose fat, and feel more confident in your body." },
              { icon: <IconArrows />, title: "Move better, feel better", body: "Better mobility, better movement patterns, less pain." },
              { icon: <IconLeaf />, title: "Sustainable results", body: "You'll learn how to train, eat, and recover in a way you can actually maintain for years." },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ background: "#f0ebe3", padding: "36px 32px", borderBottom: `2px solid ${ACCENT}` }}>
                <div style={{ color: ACCENT, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4+5: WHO THIS IS FOR + HOW WE COACH ──────────────────── */}
      <section className="ch-section" style={{ background: "#fff" }}>
        <div className="ch-narrow">
          <div className="ch-2col">
            {/* Who this is for */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT_DARK, marginBottom: 16 }}>Who this is for</p>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(24px,2.5vw,36px)", fontWeight: 700, color: TEXT, lineHeight: 1.2, marginBottom: 32 }}>
                Who this is for
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  "You want to get stronger, leaner, and move better",
                  "You want personalized coaching and real accountability",
                  "You've tried random programs and are ready for a plan that actually works",
                  "You're ready to commit to 3–6 months and put in the work",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <IconCheck />
                    <span style={{ fontSize: 15, color: TEXT, lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How we coach */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT_DARK, marginBottom: 16 }}>How we coach</p>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(24px,2.5vw,36px)", fontWeight: 700, color: TEXT, lineHeight: 1.2, marginBottom: 14 }}>
                How we coach
              </h2>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 32 }}>
                Your program is 100% personalized and evolves with you. We look at the whole picture — training, recovery, nutrition, lifestyle, and mindset — so nothing is missed.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                {[
                  { icon: <IconBarbell />, title: "Custom training", body: "Built around your goals, experience, equipment, schedule, and recovery." },
                  { icon: <IconCalendar />, title: "Weekly check-ins", body: "I review your progress and adjust your plan every week." },
                  { icon: <IconPlay />, title: "Form feedback", body: "Send videos, get detailed feedback, and improve your technique." },
                  { icon: <IconMessage />, title: "Direct support", body: "Message me anytime. I'm here when you need guidance." },
                  { icon: <IconShield />, title: "Injury-aware approach", body: "We work around your injuries and build resilience." },
                  { icon: <IconBook />, title: "Education", body: "You'll understand why you're doing what you're doing and how to progress long term." },
                ].map(({ icon, title, body }) => (
                  <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }}>{icon}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: "0 0 4px" }}>{title}</p>
                      <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.55 }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: HOW COACHING WORKS ────────────────────────────────── */}
      <section className="ch-section" style={{ background: CREAM }}>
        <div className="ch-narrow" style={{ maxWidth: 760 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT_DARK, marginBottom: 16 }}>How coaching works</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(26px,3vw,40px)", fontWeight: 700, color: TEXT, lineHeight: 1.2, marginBottom: 56 }}>
            How coaching works
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                n: "1",
                title: "You apply for coaching",
                body: "You fill out a short application so I can understand your goals, training history, schedule, equipment, injuries, and what you need help with most. I personally review every application.",
              },
              {
                n: "2",
                title: "We define your goals",
                body: "After your first check-in, we set clear goals based on where you are now and where you want to go. Strength, muscle, fat loss, body recomposition, movement quality, or consistency — we get specific.",
              },
              {
                n: "3",
                title: "I build your program",
                body: "Your training is built around your goal, your body, your experience level, your schedule, your equipment, and your recovery. A plan that makes sense for you, not just one that looks good on paper.",
              },
              {
                n: "4",
                title: "You train inside your platform",
                body: "You open your workouts from your phone, follow the plan, watch exercise videos when needed, and log your sets, reps, weight, and RPE as you train. Everything is easy to access while you're at the gym.",
              },
              {
                n: "5",
                title: "We track and adjust",
                body: "Every week, you complete a check-in. I review your training, recovery, nutrition, body metrics, progress, struggles, and wins. Then we adjust what needs to be adjusted so you keep moving forward.",
              },
            ].map(({ n, title, body }, i, arr) => (
              <div key={n} style={{ display: "flex", gap: 24, paddingBottom: i < arr.length - 1 ? 36 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none", marginBottom: i < arr.length - 1 ? 36 : 0 }}>
                <div className="ch-step-num">{n}</div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: 20, fontWeight: 700, color: TEXT, margin: "6px 0 10px" }}>{title}</h3>
                  <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: A TYPICAL WEEK ─────────────────────────────────────── */}
      <section className="ch-section" style={{ background: "#fff" }}>
        <div className="ch-narrow" style={{ maxWidth: 720 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT_DARK, marginBottom: 16 }}>A typical week</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(26px,3vw,40px)", fontWeight: 700, color: TEXT, lineHeight: 1.2, marginBottom: 32 }}>
            A typical week inside coaching
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
            {[
              "You open your program from your phone and follow your workouts for the week.",
              "You log your sets, reps, weights, and notes as you train.",
              "You send me form videos when you want feedback.",
              "You message me if you have questions or need help adjusting something.",
              "At the end of the week, you complete your check-in.",
              "I review everything and make the adjustments needed based on your progress, recovery, and goals.",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <IconCheck />
                <span style={{ fontSize: 16, color: TEXT, lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 24, fontStyle: "italic", color: ACCENT, margin: 0 }}>
            Simple. Structured. Personal.
          </p>
        </div>
      </section>

      {/* ── SECTION 8: INVESTMENT ─────────────────────────────────────────── */}
      <section className="ch-section" style={{ background: "#0a0a0a" }}>
        <div className="ch-narrow">
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: ACCENT, marginBottom: 14 }}>Investment</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(26px,3vw,40px)", fontWeight: 700, color: "#f5f2ee", lineHeight: 1.2, margin: 0 }}>
              Investment
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, maxWidth: 780, margin: "0 auto 40px" }}>
            {/* Card 1 */}
            <div style={{ background: "#161616", padding: "44px 40px", borderTop: `2px solid #333` }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,230,211,0.45)", marginBottom: 14 }}>3-month coaching</p>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 44, fontWeight: 900, color: ACCENT, margin: "0 0 4px", lineHeight: 1 }}>$1,497</p>
              <p style={{ fontSize: 13, color: "rgba(240,230,211,0.4)", marginBottom: 28 }}>per month</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: ACCENT, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "rgba(240,230,211,0.65)", lineHeight: 1.5 }}>3-month minimum commitment</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: ACCENT, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "rgba(240,230,211,0.65)", lineHeight: 1.5 }}>Best if you want focused support, a clear plan, and accountability while you build momentum.</span>
                </div>
              </div>
            </div>

            {/* Card 2 — highlighted */}
            <div style={{ background: "#1e1a15", padding: "44px 40px", borderTop: `2px solid ${ACCENT}`, position: "relative" }}>
              <div style={{ position: "absolute", top: -1, left: 0, right: 0, height: 2, background: ACCENT }} />
              <div style={{ position: "absolute", top: 18, right: 18, background: ACCENT, color: "#0a0a0a", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px" }}>
                Save $300/mo
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,230,211,0.45)", marginBottom: 14 }}>6-month coaching</p>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 44, fontWeight: 900, color: ACCENT, margin: "0 0 4px", lineHeight: 1 }}>$1,197</p>
              <p style={{ fontSize: 13, color: "rgba(240,230,211,0.4)", marginBottom: 28 }}>per month</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: ACCENT, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "rgba(240,230,211,0.65)", lineHeight: 1.5 }}>6-month minimum commitment</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: ACCENT, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, color: "rgba(240,230,211,0.65)", lineHeight: 1.5 }}>Best if you want longer-term support, more time to build strength, improve body composition, and create lasting results.</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, color: "rgba(240,230,211,0.45)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
              Coaching is by application only because I keep spots limited and want to make sure it&apos;s the right fit on both sides.
            </p>
            <a href="#apply" className="ch-btn-primary" style={{ display: "inline-block" }}>Apply Now</a>
            <p style={{ fontSize: 12, color: "rgba(240,230,211,0.3)", marginTop: 16 }}>Applications reviewed personally within 48 hours.</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 9: A COACH WHO GETS IT ───────────────────────────────── */}
      <section className="ch-section" style={{ background: CREAM }}>
        <div className="ch-narrow">
          <div className="ch-2col">
            {/* PHOTO: save /public/lisa-coaching-about.jpg (portrait — flexing or confident pose) */}
            <div style={{ position: "relative", height: 540, background: "#e8e2d9", overflow: "hidden", flexShrink: 0 }}>
              <Image
                src="/lisa-coaching-about.jpg"
                alt="Lisa McPherson"
                fill
                style={{ objectFit: "cover", objectPosition: "top center" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT_DARK, marginBottom: 16 }}>A coach who gets it</p>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(26px,3vw,40px)", fontWeight: 700, color: TEXT, lineHeight: 1.2, marginBottom: 24 }}>
                A coach who gets it
              </h2>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, marginBottom: 20 }}>
                I&apos;ve been through my own injuries and setbacks. I know how discouraging it can feel, and how hard it is to know what to do.
              </p>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, marginBottom: 20 }}>
                I rebuilt my body through smart training, patience, and consistency — and now I help others do the same.
              </p>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, marginBottom: 40 }}>
                My goal is simple: to help you build a strong, resilient body that supports the life you want to live.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                {[
                  "Evidence-based and practical",
                  "Focused on long-term results",
                  "Realistic and sustainable",
                  "You&apos;re not just a number",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: ACCENT, fontSize: 18, lineHeight: 1 }}>—</span>
                    <span style={{ fontSize: 14, color: TEXT, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: item }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 10: APPLY FORM ────────────────────────────────────────── */}
      <section id="apply" className="ch-section" style={{ background: "#f0ebe3" }}>
        <div className="ch-narrow">
          <div className="ch-2col">
            {/* Left: heading */}
            <div style={{ paddingTop: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT_DARK, marginBottom: 16 }}>Apply for coaching</p>
              <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(26px,3vw,40px)", fontWeight: 700, color: TEXT, lineHeight: 1.2, marginBottom: 20 }}>
                Apply for coaching
              </h2>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, marginBottom: 12 }}>
                Tell me about your goals, your training, and what you need help with most.
              </p>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, marginBottom: 36 }}>
                I personally review every application and respond within 48 hours.
              </p>
              <Link href="/courses" className="ch-link">
                Not ready for coaching yet? Start with Training Foundations first →
              </Link>
            </div>

            {/* Right: form */}
            <div>
              {status === "done" ? (
                <div style={{ background: "#0a0a0a", padding: "52px 44px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 30, fontWeight: 700, color: ACCENT, marginBottom: 16 }}>Got it — thank you.</p>
                  <p style={{ fontSize: 16, color: "rgba(240,230,211,0.6)", lineHeight: 1.7 }}>
                    Your application has been received. I&apos;ll be in touch within 48 hours. Check your inbox (and spam just in case).
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Q1+Q2: Name + Email */}
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

                  {/* Q3: Training experience */}
                  <div>
                    <Label>How long have you been training consistently? *</Label>
                    <div className="ch-select-wrap">
                      <select required value={form.trainingExperience} onChange={set("trainingExperience")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                        <option value="">Select…</option>
                        <option>Less than 6 months</option>
                        <option>6 to 12 months</option>
                        <option>1 to 2 years</option>
                        <option>3 to 5 years</option>
                        <option>5+ years</option>
                      </select>
                    </div>
                  </div>

                  {/* Q4: Primary goal */}
                  <div>
                    <Label>What is your primary goal? *</Label>
                    <div className="ch-select-wrap">
                      <select required value={form.primaryGoal} onChange={set("primaryGoal")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                        <option value="">Select…</option>
                        <option>Build strength</option>
                        <option>Build muscle</option>
                        <option>Lose fat or body recomposition</option>
                        <option>Get my first pull-up or specific skill</option>
                        <option>Move better and improve mobility</option>
                        <option>Return after injury or train around limitations</option>
                        <option>General fitness and health</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Q5: Why now */}
                  <div>
                    <Label>Why do you want to start coaching now? *</Label>
                    <textarea required rows={4} value={form.whyNow} onChange={set("whyNow")} style={{ ...inputBase, resize: "vertical" }} className="ch-input" />
                  </div>

                  {/* Q6+Q7: Days + Equipment */}
                  <div className="ch-2col-form">
                    <div>
                      <Label>Days per week you can train? *</Label>
                      <div className="ch-select-wrap">
                        <select required value={form.daysPerWeek} onChange={set("daysPerWeek")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                          <option value="">Select…</option>
                          <option>2 to 3</option>
                          <option>3 to 4</option>
                          <option>4</option>
                          <option>5+</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>Equipment access? *</Label>
                      <div className="ch-select-wrap">
                        <select required value={form.equipment} onChange={set("equipment")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                          <option value="">Select…</option>
                          <option>Full commercial gym</option>
                          <option>Home gym with rack, barbell, and plates</option>
                          <option>Dumbbells and bench</option>
                          <option>Dumbbells only</option>
                          <option>Bodyweight only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Q8: Injuries */}
                  <div>
                    <Label>Any current or past injuries, pain, or limitations I should know about? *</Label>
                    <textarea required rows={3} value={form.injuries} onChange={set("injuries")} placeholder="None, or describe..." style={{ ...inputBase, resize: "vertical" }} className="ch-input" />
                  </div>

                  {/* Q9: Courses */}
                  <div>
                    <Label>Have you completed my Training Foundations or Nutrition Foundations course? *</Label>
                    <div className="ch-select-wrap">
                      <select required value={form.coursesCompleted} onChange={set("coursesCompleted")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                        <option value="">Select…</option>
                        <option>Yes, both</option>
                        <option>Training Foundations only</option>
                        <option>Nutrition Foundations only</option>
                        <option>Not yet</option>
                        <option>Currently working through them</option>
                      </select>
                    </div>
                  </div>

                  {/* Q10: Coaching option */}
                  <div>
                    <Label>Which coaching option are you interested in? *</Label>
                    <div className="ch-select-wrap">
                      <select required value={form.coachingOption} onChange={set("coachingOption")} style={{ ...inputBase, paddingRight: 36 }} className="ch-input">
                        <option value="">Select…</option>
                        <option>$1,497/month, 3-month commitment</option>
                        <option>$1,197/month, 6-month commitment</option>
                        <option>Not sure yet, I would like to discuss on a call</option>
                      </select>
                    </div>
                  </div>

                  {/* Q11: Why Lisa */}
                  <div>
                    <Label>Why do you want to work with me specifically? *</Label>
                    <textarea required rows={4} value={form.whyLisa} onChange={set("whyLisa")} style={{ ...inputBase, resize: "vertical" }} className="ch-input" />
                  </div>

                  {status === "error" && (
                    <p style={{ fontSize: 13, color: "#c0392b" }}>Something went wrong. Please try again or reach out on Instagram.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="ch-btn-primary"
                    style={{ width: "100%", opacity: status === "sending" ? 0.6 : 1, fontSize: 13 }}
                  >
                    {status === "sending" ? "Sending…" : "Submit Application"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
