"use client"

import Link from "next/link"
import { useState } from "react"
import type { SiteSettings } from "@/lib/siteSettings"

interface Props {
  settings: SiteSettings
}

export default function CoachingClient({ settings }: Props) {
  const [form, setForm] = useState({ name: "", email: "", goal: "", message: "" })
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")

  const t = settings.text
  const accent = settings.colors.accent
  const hs = settings.typography.headingScale
  const bs = settings.typography.bodyScale

  const features = [
    { title: t.coachingFeature1Title, body: t.coachingFeature1Body },
    { title: t.coachingFeature2Title, body: t.coachingFeature2Body },
    { title: t.coachingFeature3Title, body: t.coachingFeature3Body },
    { title: t.coachingFeature4Title, body: t.coachingFeature4Body },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "coaching" }),
      })
      if (res.ok) {
        setStatus("done")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#f5f2ee",
    border: "1px solid rgba(0,0,0,0.1)",
    padding: "14px 16px",
    fontSize: 15,
    fontFamily: "var(--font-dm-sans), sans-serif",
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif", overflowX: "hidden" }}>
      <style>{`
        :root { --accent: ${accent}; --accent-dark: #a8895e; --muted: #6b6560; }
      `}</style>

      {/* HERO */}
      <section style={{ background: "#0a0a0a", padding: "100px 80px 80px" }} className="coaching-hero">
        <style>{`
          @media (max-width: 768px) { .coaching-hero { padding: 72px 28px 60px !important; } }
        `}</style>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 24 }}>Online coaching 1:1</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(40px, 5vw, 64px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.08, marginBottom: 20 }}>
            {t.coachingHeroHeadline}
          </h1>
          <p style={{ fontSize: `calc(15px * ${bs})`, fontWeight: 500, letterSpacing: "0.04em", color: accent, marginBottom: 24, fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Smart programming. Real accountability. Long-term progress.
          </p>
          <p style={{ fontSize: `calc(17px * ${bs})`, color: "rgba(245,242,238,0.55)", lineHeight: 1.4 }}>
            {t.coachingHeroSubtext}
          </p>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section style={{ padding: "100px 80px", background: "#faf8f5" }} className="coaching-includes">
        <style>{`
          @media (max-width: 768px) { .coaching-includes { padding: 72px 28px !important; } .coaching-grid { grid-template-columns: 1fr !important; } }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 16 }}>What you get</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(30px, 3.5vw, 44px) * ${hs})`, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.15, marginBottom: 56 }}>
            Personalized to you.<br />
            <em style={{ fontStyle: "italic", color: "#a8895e" }}>Training that adapts to your body, your goals, and your life.</em>
          </h2>
          <div className="coaching-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
            {features.map((item) => (
              <div key={item.title} style={{ background: "#f0ebe3", padding: "40px 36px", borderBottom: "2px solid #c8a97e" }}>
                <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(22px * ${hs})`, fontWeight: 700, color: "#1a1a1a", marginBottom: 14 }}>{item.title}</h3>
                <p style={{ fontSize: `calc(14px * ${bs})`, lineHeight: 1.4, color: "#6b6560" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section style={{ background: "#f0ebe3", padding: "100px 80px" }} className="coaching-form-section">
        <style>{`
          @media (max-width: 768px) { .coaching-form-section { padding: 72px 28px !important; } .coaching-form-grid { grid-template-columns: 1fr !important; gap: 48px !important; } }
        `}</style>
        <div className="coaching-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, maxWidth: 1100, margin: "0 auto", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 20 }}>Apply for coaching</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(28px, 3vw, 40px) * ${hs})`, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2, marginBottom: 20 }}>
              {t.coachingFormHeadline.replace(/\\n/g, "\n").split("\n").map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
              ))}
            </h2>
            <p style={{ fontSize: `calc(15px * ${bs})`, lineHeight: 1.4, color: "#6b6560", marginBottom: 28 }}>
              {t.coachingFormSubtext}
            </p>
            <p style={{ fontSize: 13, color: "#a8895e", fontWeight: 500 }}>
              Not ready to apply? Start with the course →{" "}
              <Link href="/courses" style={{ color: "#a8895e" }}>Training Foundations</Link>
            </p>
          </div>

          <div>
            {status === "done" ? (
              <div style={{ background: "#0a0a0a", padding: "48px 40px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 28, fontWeight: 700, color: "#c8a97e", marginBottom: 16 }}>Got it — thank you.</p>
                <p style={{ fontSize: 15, color: "rgba(245,242,238,0.6)", lineHeight: 1.7 }}>
                  I&apos;ll review your application and get back to you within 48 hours. Check your inbox (and spam just in case).
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6560", marginBottom: 6 }}>Name *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6560", marginBottom: 6 }}>Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6560", marginBottom: 6 }}>What&apos;s your main goal?</label>
                  <input
                    type="text"
                    placeholder="e.g. Build strength, fix my form, lose body fat..."
                    value={form.goal}
                    onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                    style={{ ...inputStyle, color: form.goal ? "#1a1a1a" : "#999" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6560", marginBottom: 6 }}>Tell me where you&apos;re at *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Training history, injuries, what's worked or hasn't, what you're looking for..."
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                {status === "error" && (
                  <p style={{ fontSize: 13, color: "#c0392b" }}>Something went wrong. Please try again or reach out on Instagram.</p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  style={{ background: "#c8a97e", color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", border: "none", padding: "18px 40px", cursor: "pointer", opacity: status === "sending" ? 0.6 : 1 }}
                >
                  {status === "sending" ? "Sending..." : "Submit Application"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
