"use client"

import { useState } from "react"
import Link from "next/link"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const warmWhite = "#faf8f5"
const border = "#e8e2dc"

export default function AcceptTermsClient({ token, email }: { token: string; email: string }) {
  const [termsChecked, setTermsChecked] = useState(false)
  const [waiverChecked, setWaiverChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!termsChecked || !waiverChecked) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/coaching/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setDone(true)
      } else {
        setError(data.error ?? "Something went wrong. Please try again.")
        setSubmitting(false)
      }
    } catch {
      setError("Network error. Please try again.")
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main style={{ minHeight: "100dvh", background: warmWhite, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${accent}20`, border: `2px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10l4.5 4.5L16 6" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: black, marginBottom: 16 }}>
            You&apos;re all set.
          </h1>
          <p style={{ fontSize: 15, color: muted, lineHeight: 1.7, marginBottom: 28, fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Your acceptance has been recorded and your coaching portal is now active.
            Check your email &mdash; you&apos;ll receive a link to set up your account shortly.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-block",
              background: accent,
              color: black,
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              textDecoration: "none",
              padding: "14px 28px",
            }}
          >
            Go to Login →
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: "100dvh", background: warmWhite, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: 540, width: "100%" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 12, fontFamily: "var(--font-dm-sans), sans-serif" }}>
          1:1 Coaching
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700, color: black, lineHeight: 1.2, marginBottom: 12 }}>
          Accept Coaching Terms
        </h1>
        <p style={{ fontSize: 15, color: muted, lineHeight: 1.7, marginBottom: 8, fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Accepting as: <strong style={{ color: black }}>{email}</strong>
        </p>
        <p style={{ fontSize: 15, color: muted, lineHeight: 1.7, marginBottom: 28, fontFamily: "var(--font-dm-sans), sans-serif" }}>
          Please read and personally accept each of the following before your coaching portal is activated.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20, cursor: "pointer", padding: "16px", border: `1px solid ${border}`, borderRadius: 4, background: "#fff" }}>
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              style={{ marginTop: 3, accentColor: accent, flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: muted, lineHeight: 1.6, fontFamily: "var(--font-dm-sans), sans-serif" }}>
              I have read and agree to the{" "}
              <a href="/terms#coaching" target="_blank" rel="noopener noreferrer" style={{ color: "#a8895e", textDecoration: "underline" }}>
                Coaching Terms &amp; Conditions
              </a>
              , including the program commitment, cancellation policy, and refund policy.
            </span>
          </label>

          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 24, cursor: "pointer", padding: "16px", border: `1px solid ${border}`, borderRadius: 4, background: "#fff" }}>
            <input
              type="checkbox"
              checked={waiverChecked}
              onChange={(e) => setWaiverChecked(e.target.checked)}
              style={{ marginTop: 3, accentColor: accent, flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: muted, lineHeight: 1.6, fontFamily: "var(--font-dm-sans), sans-serif" }}>
              I have read and agree to the{" "}
              <a href="/terms#risk" target="_blank" rel="noopener noreferrer" style={{ color: "#a8895e", textDecoration: "underline" }}>
                Assumption of Risk &amp; Liability Waiver
              </a>
              {" "}and understand that exercise, including remote/online training, involves inherent risks of injury, illness, or death. I confirm that I have disclosed any known injury, medical condition, physical limitation, pregnancy, or other circumstance relevant to my ability to exercise safely and agree to update Lisa Fit Method if that information changes.
            </span>
          </label>

          {error && (
            <p style={{ fontSize: 13, color: "#d9534f", marginBottom: 16, fontFamily: "var(--font-dm-sans), sans-serif" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!termsChecked || !waiverChecked || submitting}
            style={{
              width: "100%",
              background: (!termsChecked || !waiverChecked) ? "#ddd5ca" : submitting ? "#b8996a" : accent,
              color: (!termsChecked || !waiverChecked) ? "#9a9087" : black,
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              border: "none",
              padding: "18px 32px",
              cursor: (!termsChecked || !waiverChecked || submitting) ? "not-allowed" : "pointer",
              transition: "background 0.2s ease",
            }}
          >
            {submitting ? "Saving…" : "Accept & Activate Portal →"}
          </button>

          <p style={{ fontSize: 11, color: "#bbb5af", marginTop: 12, textAlign: "center", fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Both boxes must be checked before you can continue. This acceptance is recorded with the date and time.
          </p>
        </form>
      </div>
    </main>
  )
}
