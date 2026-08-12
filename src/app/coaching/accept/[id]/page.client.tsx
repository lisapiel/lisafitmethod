"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

const ACCENT = "#c8a97e"
const ACCENT_DARK = "#a8895e"
const BLACK = "#0a0a0a"
const CREAM = "#f5f2ee"
const MUTED = "rgba(245,242,238,0.55)"
const BORDER = "rgba(200,169,126,0.25)"

type Props = {
  applicationId: string
  applicantName: string
  applicantEmail: string
  coachingOption: string | null
  checkoutUrl: string
}

// Parse the coaching option string ("3-month coaching — $397/month" etc.)
// into a canonical shape for the acceptance disclosure. Falls back to a
// generic "your monthly coaching subscription" line if the option isn't
// one of the known tiers.
function summariseTier(coachingOption: string | null): {
  headline: string
  billingLine: string
} {
  const opt = (coachingOption ?? "").toLowerCase()
  if (opt.includes("397") || opt.includes("3-month")) {
    return {
      headline: "3-month coaching · $397/month",
      billingLine:
        "recurring billing of $397/month, a 3-month minimum commitment, and month-to-month billing thereafter until cancelled",
    }
  }
  if (opt.includes("497") || opt.includes("month-to-month") || opt.includes("month to month")) {
    return {
      headline: "Month-to-month coaching · $497/month",
      billingLine: "recurring billing of $497/month until cancelled",
    }
  }
  return {
    headline: "1:1 Coaching",
    billingLine: "the monthly billing terms shown on the payment page",
  }
}

export default function AcceptClient({
  applicationId,
  applicantName,
  applicantEmail,
  coachingOption,
  checkoutUrl,
}: Props) {
  const tier = useMemo(() => summariseTier(coachingOption), [coachingOption])
  const [termsChecked, setTermsChecked] = useState(false)
  const [waiverChecked, setWaiverChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canContinue = termsChecked && waiverChecked && !submitting

  async function handleContinue() {
    if (!canContinue) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/coaching/record-acceptance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          coachingOption,
        }),
      })
      if (!res.ok) {
        setError("Something went wrong. Please try again or contact lisa@lisafitmethod.com.")
        setSubmitting(false)
        return
      }
      // Full-page redirect to Stripe's hosted checkout.
      window.location.href = checkoutUrl
    } catch {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  const firstName = applicantName.split(" ")[0] || "there"

  return (
    <main style={{ background: BLACK, minHeight: "100vh", color: CREAM, fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "clamp(56px, 8vw, 96px) clamp(20px, 4vw, 32px) 80px" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT, marginBottom: 20 }}>
          Final step · 1:1 Coaching
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: CREAM, lineHeight: 1.15, marginBottom: 16 }}>
          You&apos;re in, {firstName}.
        </h1>
        <p style={{ fontSize: "clamp(15px, 1.05vw, 16px)", color: MUTED, lineHeight: 1.7, marginBottom: 12 }}>
          Two quick acknowledgements before we hand you to secure Stripe checkout.
        </p>
        <p style={{ fontSize: 13, color: "rgba(245,242,238,0.4)", marginBottom: 40 }}>
          Signed in as <strong style={{ color: "rgba(245,242,238,0.7)" }}>{applicantEmail}</strong>
        </p>

        {/* Tier summary card */}
        <div style={{ background: "#161616", border: `1px solid ${BORDER}`, borderLeft: `3px solid ${ACCENT}`, padding: "20px 24px", marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: ACCENT, margin: "0 0 8px" }}>
            You&apos;re signing up for
          </p>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 20, fontWeight: 700, color: CREAM, margin: 0 }}>
            {tier.headline}
          </p>
        </div>

        {/* Checkbox 1 — Coaching Terms */}
        <label style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "18px 20px", background: termsChecked ? "rgba(200,169,126,0.08)" : "#111", border: `1px solid ${termsChecked ? ACCENT : "rgba(200,169,126,0.15)"}`, marginBottom: 14, cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}>
          <input
            type="checkbox"
            checked={termsChecked}
            onChange={(e) => setTermsChecked(e.target.checked)}
            style={{ marginTop: 3, accentColor: ACCENT, flexShrink: 0, width: 18, height: 18, cursor: "pointer" }}
          />
          <span style={{ fontSize: 14, color: "rgba(245,242,238,0.85)", lineHeight: 1.65 }}>
            I agree to the{" "}
            <a
              href="/terms#coaching"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: ACCENT, textDecoration: "underline" }}
            >
              Lisa Fit Method Coaching Terms &amp; Conditions
            </a>
            , including {tier.billingLine}.
          </span>
        </label>

        {/* Checkbox 2 — Liability waiver */}
        <label style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "18px 20px", background: waiverChecked ? "rgba(200,169,126,0.08)" : "#111", border: `1px solid ${waiverChecked ? ACCENT : "rgba(200,169,126,0.15)"}`, marginBottom: 24, cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}>
          <input
            type="checkbox"
            checked={waiverChecked}
            onChange={(e) => setWaiverChecked(e.target.checked)}
            style={{ marginTop: 3, accentColor: ACCENT, flexShrink: 0, width: 18, height: 18, cursor: "pointer" }}
          />
          <span style={{ fontSize: 14, color: "rgba(245,242,238,0.85)", lineHeight: 1.65 }}>
            I have read and agree to the{" "}
            <a
              href="/terms#risk"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: ACCENT, textDecoration: "underline" }}
            >
              Assumption of Risk &amp; Liability Waiver
            </a>
            {" "}and understand that exercise, including remote/online training, involves inherent risks of injury, illness, or death. I confirm that I have disclosed any known injury, medical condition, physical limitation, pregnancy, or other circumstance relevant to my ability to exercise safely and agree to update Lisa Fit Method if that information changes.
          </span>
        </label>

        {error && (
          <p style={{ color: "#ff9080", fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          style={{
            width: "100%",
            background: canContinue ? ACCENT : "#3a2f1f",
            color: canContinue ? BLACK : "#6a5a3f",
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            border: "none",
            padding: "20px 32px",
            cursor: canContinue ? "pointer" : "not-allowed",
            transition: "background 0.15s ease",
          }}
        >
          {submitting ? "Redirecting…" : "Continue to secure payment →"}
        </button>

        <p style={{ fontSize: 12, color: "rgba(245,242,238,0.35)", marginTop: 16, textAlign: "center", lineHeight: 1.6 }}>
          Payment is processed securely by Stripe. You&apos;ll be redirected after both acknowledgements.
        </p>

        <p style={{ fontSize: 12, color: "rgba(245,242,238,0.3)", marginTop: 32, textAlign: "center" }}>
          Wrong tier?{" "}
          <Link href="mailto:lisa@lisafitmethod.com" style={{ color: ACCENT_DARK, textDecoration: "underline" }}>
            Reply to my email
          </Link>
          {" "}and I&apos;ll adjust.
        </p>
      </div>
    </main>
  )
}
