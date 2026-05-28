"use client"
import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getCurrentUser } from "aws-amplify/auth"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "")

const stripeAppearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#c9a96e",
    colorBackground: "#161616",
    colorText: "#f0e6d3",
    colorTextSecondary: "#888888",
    colorDanger: "#ff6b6b",
    fontFamily: "Montserrat, system-ui, sans-serif",
    borderRadius: "0px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1px solid #2a2a2a", backgroundColor: "#1a1a1a" },
    ".Input:focus": { border: "1px solid #c9a96e", boxShadow: "none" },
    ".Label": { color: "#888888", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "10px" },
    ".Tab": { border: "1px solid #2a2a2a", backgroundColor: "#161616" },
    ".Tab--selected": { border: "1px solid #c9a96e", color: "#c9a96e" },
  },
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  color: "#f0e6d3",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: 16,
  padding: "14px 16px",
  outline: "none",
  marginBottom: 16,
  boxSizing: "border-box",
}

const ctaButtonStyle: React.CSSProperties = {
  width: "100%",
  background: "#c9a96e",
  color: "#0a0a0a",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  border: "none",
  padding: "18px 32px",
  cursor: "pointer",
}

function PaymentForm({ email, onBack }: { email: string; onBack: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    setError(null)
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/tracker-checkout/success?email=${encodeURIComponent(email)}`,
      },
    })
    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.")
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#1a1a1a", border: "1px solid #2a2a2a", marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-montserrat), sans-serif" }}>{email}</span>
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "#c9a96e", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em" }}>
          Change
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <PaymentElement options={{ layout: "tabs", fields: { billingDetails: { name: "auto" } } }} />
      </div>

      {error && <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-montserrat), sans-serif" }}>{error}</p>}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{ ...ctaButtonStyle, background: processing ? "#8a7550" : "#c9a96e", cursor: processing ? "not-allowed" : "pointer", marginBottom: 16 }}
      >
        {processing ? "Processing…" : "Complete Purchase · $27"}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#555", fontSize: 11, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em" }}>
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
          <rect x="1" y="6" width="10" height="8" rx="1" stroke="#555" strokeWidth="1.2" />
          <path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="#555" strokeWidth="1.2" />
        </svg>
        Secured by Stripe · SSL encrypted
      </div>
    </form>
  )
}

export function TrackerCheckoutClient() {
  const [email, setEmail] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [intentError, setIntentError] = useState<string | null>(null)

  // Pre-fill email if logged in
  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (user.signInDetails?.loginId) {
          setEmailInput(user.signInDetails.loginId)
        }
      })
      .catch(() => {})
  }, [])

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = emailInput.trim().toLowerCase()
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError("Please enter a valid email address.")
      return
    }
    setEmail(trimmed)
    setEmailError(null)
  }

  const handleConfirm = useCallback(async () => {
    if (!email) return
    setConfirmed(true)
    setLoadingIntent(true)
    setIntentError(null)
    try {
      const res = await fetch("/api/stripe/tracker-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { clientSecret?: string; error?: string }
      if (!res.ok) {
        setIntentError("Something went wrong. Please try again.")
        setEmail(null)
        setConfirmed(false)
        return
      }
      setClientSecret(data.clientSecret!)
    } catch {
      setIntentError("Something went wrong. Please try again.")
      setEmail(null)
      setConfirmed(false)
    } finally {
      setLoadingIntent(false)
    }
  }, [email])

  const handleBack = useCallback(() => {
    setEmail(null)
    setConfirmed(false)
    setClientSecret(null)
  }, [])

  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh", color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .tracker-grid { grid-template-columns: 1fr !important; }
          .tracker-left { padding: 40px 24px 0 !important; border-right: none !important; border-bottom: 1px solid #1a1a1a; }
          .tracker-right { padding: 36px 24px 60px !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #1a1a1a" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 20, fontWeight: 600, color: "#f0e6d3", letterSpacing: "0.05em" }}>
            Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#555", letterSpacing: "0.1em" }}>
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
            <rect x="0.5" y="5" width="9" height="7" rx="1" stroke="#555" strokeWidth="1" />
            <path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="#555" strokeWidth="1" />
          </svg>
          SECURE CHECKOUT
        </div>
      </div>

      <div className="tracker-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 900, margin: "0 auto", minHeight: "calc(100vh - 61px)" }}>

        {/* LEFT */}
        <div className="tracker-left" style={{ padding: "60px 48px 60px 40px", borderRight: "1px solid #1a1a1a" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 8 }}>
            My Workout Tracker
          </p>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 400, color: "#f0e6d3", lineHeight: 1.2, marginBottom: 8 }}>
            Skip the $15/mo app.<br />
            <em>Own yours for $27. Forever.</em>
          </h1>

          <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "24px 0 12px", paddingBottom: 0 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: "#c9a96e", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1 }}>$27</span>
            <span style={{ fontSize: 12, color: "#666" }}>one-time · no subscription · ever</span>
          </div>
          <p style={{ fontSize: 11, color: "#444", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.6, marginBottom: 0, paddingBottom: 24, borderBottom: "1px solid #1a1a1a" }}>
            Add it to your phone home screen and it opens like a native app.{" "}
            <Link href="/terms#access-policy" style={{ color: "#a8895e", textDecoration: "underline", textUnderlineOffset: 2 }}>
              See terms.
            </Link>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {[
              { heading: "Installs to your home screen like an app", body: "Add it from your browser and it opens full-screen, no browser bar. One tap, you’re in the gym." },
              { heading: "Works for any workout, not just this program", body: "Build completely custom days with any exercises you want. Push day, pull day, leg day. Anything." },
              { heading: "Progressive overload built in", body: "Last week’s numbers show right next to where you log. You always know exactly what to beat." },
              { heading: "Log sets, reps, and weight in seconds", body: "Per exercise, choose: weight + reps, reps only, or time. No clutter, just the fields you actually need." },
              { heading: "Your history lives on your device", body: "Unlimited weeks, never resets. Keep using it years after the course ends." },
            ].map((item) => (
              <div key={item.heading} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "#c9a96e", fontSize: 11, marginTop: 2, flexShrink: 0 }}>✓</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#f0e6d3", marginBottom: 2 }}>{item.heading}</p>
                  <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: "#444", lineHeight: 1.7, padding: "16px 0", borderTop: "1px solid #1a1a1a" }}>
            Most people pay $10–20 a month for a workout tracking app. This is $27 once. It works for this program, the next one, and every program after that.
          </p>
        </div>

        {/* RIGHT */}
        <div className="tracker-right" style={{ padding: "60px 40px 60px 48px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: 28 }}>
            Complete your purchase
          </p>

          {loadingIntent ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#555", fontSize: 13, letterSpacing: "0.1em" }}>
              Preparing secure payment…
            </div>
          ) : email && confirmed && clientSecret ? (
            <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
              <PaymentForm email={email} onBack={handleBack} />
            </Elements>
          ) : email && !confirmed ? (
            <div>
              <p style={{ fontSize: 12, color: "#888", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em", marginBottom: 12 }}>
                Your tracker access will be sent to:
              </p>
              <div style={{ border: "1px solid rgba(201,169,110,0.4)", padding: "14px 16px", marginBottom: 24, background: "rgba(201,169,110,0.05)" }}>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 15, color: "#f0e6d3" }}>{email}</span>
              </div>
              <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.7, marginBottom: 28 }}>
                Make sure this matches your Lisa Fit Method account email. That&apos;s where your access will be unlocked.
              </p>
              <button type="button" onClick={handleConfirm} style={{ ...ctaButtonStyle, marginBottom: 12 }}>
                That&apos;s correct, continue to payment →
              </button>
              <button type="button" onClick={handleBack} style={{ display: "block", width: "100%", background: "none", border: "none", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 12, letterSpacing: "0.08em", cursor: "pointer", padding: "8px 0", textAlign: "center" }}>
                ← Change email
              </button>
            </div>
          ) : (
            <>
              {intentError && <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{intentError}</p>}
              <form onSubmit={handleEmailSubmit}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", fontFamily: "var(--font-montserrat), sans-serif", marginBottom: 8 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setEmailError(null) }}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                  autoComplete="email"
                />
                {emailError && <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{emailError}</p>}
                <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.7, marginBottom: 24 }}>
                  Use the same email as your Lisa Fit Method account. Access will be unlocked instantly after payment.
                </p>
                <button type="submit" style={ctaButtonStyle}>Continue →</button>
              </form>
            </>
          )}

          <p style={{ marginTop: 28, fontSize: 12, color: "#444", lineHeight: 1.8, borderTop: "1px solid #1a1a1a", paddingTop: 20 }}>
            After payment, log in at{" "}
            <Link href="/my-tracker" style={{ color: "#c9a96e", textDecoration: "none" }}>
              lisafitmethod.com/my-tracker
            </Link>{" "}
            to access your tracker.
          </p>
        </div>
      </div>
    </main>
  )
}
