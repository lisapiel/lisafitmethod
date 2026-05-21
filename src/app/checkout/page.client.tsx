"use client"
import { useState, useCallback } from "react"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "")

const MODULES = [
  { num: "01", title: "Foundation Movements", desc: "The 5 movement patterns every lifter needs before adding weight." },
  { num: "02", title: "Core & Glute Priority", desc: "Targeted training that protects your lower back." },
  { num: "03", title: "The 4-Week Program", desc: "Three days a week. Sets, reps, and rest — fully structured." },
  { num: "04", title: "Nutrition Foundations", desc: "Five principles that support everything you do in the gym." },
]

// ─── Payment form (shown after email step) ───────────────────────────────────

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

    // clientSecret is already loaded into Elements options — just confirm
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/purchase-success?email=${encodeURIComponent(email)}`,
      },
    })

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.")
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-montserrat), sans-serif" }}>{email}</span>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "#c9a96e",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "var(--font-montserrat), sans-serif",
              letterSpacing: "0.1em",
            }}
          >
            Change
          </button>
        </div>

        <PaymentElement
          options={{
            layout: "tabs",
            fields: { billingDetails: { name: "auto" } },
          }}
        />
      </div>

      {error && (
        <p style={{
          color: "#ff6b6b",
          fontSize: 13,
          marginBottom: 16,
          fontFamily: "var(--font-montserrat), sans-serif",
        }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: "100%",
          background: processing ? "#8a7550" : "#c9a96e",
          color: "#0a0a0a",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          border: "none",
          padding: "18px 32px",
          cursor: processing ? "not-allowed" : "pointer",
          transition: "background 0.2s ease",
          marginBottom: 16,
        }}
      >
        {processing ? "Processing…" : "Pay $0.50 — Test Purchase"}
      </button>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "#555",
        fontSize: 11,
        fontFamily: "var(--font-montserrat), sans-serif",
        letterSpacing: "0.05em",
      }}>
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
          <rect x="1" y="6" width="10" height="8" rx="1" stroke="#555" strokeWidth="1.2" />
          <path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="#555" strokeWidth="1.2" />
        </svg>
        Secured by Stripe · SSL encrypted
      </div>
    </form>
  )
}

// ─── Email step ───────────────────────────────────────────────────────────────

function EmailStep({ onNext }: { onNext: (email: string) => void }) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }
    onNext(email.trim().toLowerCase())
  }

  return (
    <form onSubmit={handleContinue}>
      <label style={labelStyle}>Email Address</label>
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setError(null) }}
        placeholder="you@example.com"
        required
        style={inputStyle}
        autoComplete="email"
      />
      {error && (
        <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-montserrat), sans-serif" }}>
          {error}
        </p>
      )}
      <p style={{
        fontSize: 12,
        color: "#555",
        fontFamily: "var(--font-montserrat), sans-serif",
        lineHeight: 1.7,
        marginBottom: 24,
      }}>
        This is the email your course access will be sent to. After payment, you&apos;ll receive a link to set your password and log in.
      </p>
      <button type="submit" style={ctaButtonStyle}>
        Continue to Payment →
      </button>
    </form>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "#888",
  fontFamily: "var(--font-montserrat), sans-serif",
  marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  color: "#f0e6d3",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: 14,
  padding: "14px 16px",
  outline: "none",
  marginBottom: 16,
  boxSizing: "border-box" as const,
}

const ctaButtonStyle: React.CSSProperties = {
  width: "100%",
  background: "#c9a96e",
  color: "#0a0a0a",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  border: "none",
  padding: "18px 32px",
  cursor: "pointer",
}

// ─── Root component ───────────────────────────────────────────────────────────

export function CheckoutClient() {
  const [email, setEmail] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [intentError, setIntentError] = useState<string | null>(null)

  const handleEmailNext = useCallback(async (submittedEmail: string) => {
    setLoadingIntent(true)
    setIntentError(null)
    setEmail(submittedEmail)
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedEmail }),
      })
      if (!res.ok) throw new Error("Failed to initialize payment.")
      const { clientSecret: cs } = await res.json() as { clientSecret: string }
      setClientSecret(cs)
    } catch {
      setIntentError("Something went wrong. Please try again.")
      setEmail(null)
    } finally {
      setLoadingIntent(false)
    }
  }, [])

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

  return (
    <main style={{
      background: "#0a0a0a",
      minHeight: "100vh",
      color: "#f0e6d3",
      fontFamily: "var(--font-montserrat), sans-serif",
    }}>
      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .checkout-left { padding: 48px 24px 0 !important; border-right: none !important; border-bottom: 1px solid #1a1a1a; }
          .checkout-right { padding: 40px 24px 60px !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 40px",
        borderBottom: "1px solid #1a1a1a",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: 20,
            fontWeight: 600,
            color: "#f0e6d3",
            letterSpacing: "0.05em",
          }}>
            Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
          </span>
        </Link>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "#555",
          letterSpacing: "0.1em",
        }}>
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
            <rect x="0.5" y="5" width="9" height="7" rx="1" stroke="#555" strokeWidth="1" />
            <path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="#555" strokeWidth="1" />
          </svg>
          SECURE CHECKOUT
        </div>
      </div>

      {/* Two-column layout */}
      <div
        className="checkout-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: 1000,
          margin: "0 auto",
          minHeight: "calc(100vh - 61px)",
        }}
      >
        {/* LEFT — Course summary */}
        <div
          className="checkout-left"
          style={{
            padding: "60px 48px 60px 40px",
            borderRight: "1px solid #1a1a1a",
          }}
        >
          <p style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#c9a96e",
            marginBottom: 8,
          }}>
            Training Foundations
          </p>
          <h1 style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(28px, 3vw, 40px)",
            fontWeight: 400,
            color: "#f0e6d3",
            lineHeight: 1.2,
            marginBottom: 8,
          }}>
            Build the foundation.<br />
            <em>Train for life.</em>
          </h1>

          {/* Price */}
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            margin: "28px 0",
            paddingBottom: 28,
            borderBottom: "1px solid #1a1a1a",
          }}>
            <span style={{ fontSize: 14, color: "#444", textDecoration: "line-through" }}>$67</span>
            <span style={{ fontSize: 40, fontWeight: 700, color: "#c9a96e", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1 }}>$45</span>
            <span style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#c9a96e",
              border: "1px solid rgba(201,169,110,0.35)",
              padding: "4px 10px",
            }}>
              Limited Time
            </span>
          </div>

          {/* What's included */}
          <p style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: 20,
          }}>
            What&apos;s included
          </p>
          <ul style={{ listStyle: "none", marginBottom: 32 }}>
            {MODULES.map((m) => (
              <li key={m.num} style={{
                display: "flex",
                gap: 16,
                paddingBottom: 20,
                marginBottom: 20,
                borderBottom: "1px solid #161616",
              }}>
                <span style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: 32,
                  fontWeight: 300,
                  color: "rgba(201,169,110,0.2)",
                  lineHeight: 1,
                  flexShrink: 0,
                  width: 32,
                }}>
                  {m.num}
                </span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#f0e6d3", marginBottom: 4 }}>{m.title}</p>
                  <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>{m.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Trust signals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "One-time payment — yours forever",
              "Instant access after purchase",
              "4 weeks · 3 days per week",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#c9a96e", fontSize: 11 }}>✓</span>
                <span style={{ fontSize: 12, color: "#666", letterSpacing: "0.04em" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Payment form */}
        <div
          className="checkout-right"
          style={{ padding: "60px 40px 60px 48px" }}
        >
          <p style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: 28,
          }}>
            Complete your purchase
          </p>

          {loadingIntent ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#555", fontSize: 13, letterSpacing: "0.1em" }}>
              Preparing secure payment…
            </div>
          ) : email && clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: stripeAppearance }}
            >
              <PaymentForm email={email} onBack={() => { setEmail(null); setClientSecret(null) }} />
            </Elements>
          ) : (
            <>
              {intentError && (
                <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-montserrat), sans-serif" }}>
                  {intentError}
                </p>
              )}
              <EmailStep onNext={handleEmailNext} />
            </>
          )}

          <p style={{
            marginTop: 32,
            fontSize: 12,
            color: "#444",
            lineHeight: 1.8,
            borderTop: "1px solid #1a1a1a",
            paddingTop: 24,
          }}>
            After payment, you&apos;ll receive an email with your login credentials. Use them at{" "}
            <Link href="/login" style={{ color: "#c9a96e", textDecoration: "none" }}>
              lisafitmethod.com/login
            </Link>
            {" "}to access your course.
          </p>
        </div>
      </div>
    </main>
  )
}
