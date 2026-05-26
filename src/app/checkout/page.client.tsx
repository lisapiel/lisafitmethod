"use client"
import { useState, useCallback } from "react"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "")

const MODULES = [
  { num: "01", title: "Foundation Movements", desc: "Learn the 5 movement patterns every lifter needs before adding weight, intensity, or complexity." },
  { num: "02", title: "Core & Glute Priority", desc: "Targeted training designed to build strength while supporting your lower back and overall stability." },
  { num: "03", title: "The 4-Week Program", desc: "A fully structured 3-day training split with sets, reps, rest times, and progression already planned for you." },
  { num: "04", title: "Nutrition Foundations", desc: "Simple nutrition principles that support muscle growth, recovery, energy, and long-term consistency." },
]

// ─── Payment form ─────────────────────────────────────────────────────────────

function PaymentForm({
  email,
  finalAmount,
  discountPct,
  onBack,
  onApplyPromo,
}: {
  email: string
  finalAmount: number
  discountPct: number
  onBack: () => void
  onApplyPromo: (code: string) => Promise<{ error: string | null }>
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    setError(null)
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

  const handleApply = async () => {
    if (!promoCode.trim()) return
    setApplyingPromo(true)
    setPromoError(null)
    const result = await onApplyPromo(promoCode.trim())
    if (result.error) {
      setPromoError(result.error)
      setApplyingPromo(false)
    }
    // On success, parent updates clientSecret → Elements key changes → this component remounts
  }

  const isFree = discountPct === 100
  const displayAmount = `$${(finalAmount / 100).toFixed(2)}`

  return (
    <form onSubmit={handleSubmit}>
      {/* Discount banner */}
      {discountPct > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "rgba(201,169,110,0.08)",
          border: "1px solid rgba(201,169,110,0.25)",
          marginBottom: 16,
        }}>
          <span style={{ color: "#c9a96e", fontSize: 14 }}>✓</span>
          <span style={{ fontSize: 12, color: "#c9a96e", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.08em" }}>
            {isFree ? "Promo code applied — free access ($0.50 processing fee)" : `Promo code applied — ${discountPct}% off`}
          </span>
        </div>
      )}

      {/* Email chip */}
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
          style={{ background: "none", border: "none", color: "#c9a96e", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em" }}
        >
          Change
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <PaymentElement options={{ layout: "tabs", fields: { billingDetails: { name: "auto" } } }} />
      </div>

      {/* Promo code — collapsible, hidden once applied */}
      {discountPct === 0 && (
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setPromoOpen((o) => !o)}
            style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em", padding: 0, display: "flex", alignItems: "center", gap: 6 }}
          >
            <span style={{ fontSize: 16, lineHeight: 1, color: promoOpen ? "#c9a96e" : "#555", fontWeight: 300 }}>{promoOpen ? "−" : "+"}</span>
            Have a promo code?
          </button>
          {promoOpen && (
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value); setPromoError(null) }}
                placeholder="Enter promo code"
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleApply}
                disabled={applyingPromo || !promoCode.trim()}
                style={{
                  background: "none",
                  border: "1px solid rgba(201,169,110,0.4)",
                  color: "#c9a96e",
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "0 16px",
                  cursor: applyingPromo ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {applyingPromo ? "…" : "Apply"}
              </button>
            </div>
          )}
          {promoError && (
            <p style={{ color: "#ff6b6b", fontSize: 12, marginTop: 8, fontFamily: "var(--font-montserrat), sans-serif" }}>
              {promoError}
            </p>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-montserrat), sans-serif" }}>
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
        {processing ? "Processing…" : isFree ? `Complete Purchase — $0.50` : `Complete Purchase — ${displayAmount}`}
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

// ─── Email step ───────────────────────────────────────────────────────────────

function EmailStep({ onNext }: { onNext: (email: string) => void }) {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address.")
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
        onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
        placeholder="you@example.com"
        required
        style={inputStyle}
        autoComplete="email"
      />
      {emailError && (
        <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-montserrat), sans-serif" }}>
          {emailError}
        </p>
      )}

      <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.7, marginBottom: 24 }}>
        This is the email your course access will be sent to. After payment, you&apos;ll receive a link to set your password and log in.
      </p>
      <button type="submit" style={ctaButtonStyle}>
        Continue →
      </button>
    </form>
  )
}

// ─── Email confirm step ───────────────────────────────────────────────────────

function EmailConfirmStep({ email, onConfirm, onChange }: { email: string; onConfirm: () => void; onChange: () => void }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: "#888", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em", marginBottom: 12 }}>
        Your course access will be sent to:
      </p>
      <div style={{ border: "1px solid rgba(201,169,110,0.4)", padding: "14px 16px", marginBottom: 24, background: "rgba(201,169,110,0.05)" }}>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 15, color: "#f0e6d3", letterSpacing: "0.02em" }}>
          {email}
        </span>
      </div>
      <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.7, marginBottom: 28 }}>
        Make sure this is correct — your login link will be sent here after payment.
      </p>
      <button type="button" onClick={onConfirm} style={{ ...ctaButtonStyle, marginBottom: 12 }}>
        That&apos;s correct, continue to payment →
      </button>
      <button
        type="button"
        onClick={onChange}
        style={{ display: "block", width: "100%", background: "none", border: "none", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 12, letterSpacing: "0.08em", cursor: "pointer", padding: "8px 0", textAlign: "center" }}
      >
        ← Change email
      </button>
    </div>
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
  fontSize: 16,
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
  const [confirmed, setConfirmed] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [discountPct, setDiscountPct] = useState(0)
  const [finalAmount, setFinalAmount] = useState(4700)
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [intentError, setIntentError] = useState<string | null>(null)

  const handleEmailNext = useCallback((submittedEmail: string) => {
    setEmail(submittedEmail)
    setConfirmed(false)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!email) return
    setConfirmed(true)
    setLoadingIntent(true)
    setIntentError(null)
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { clientSecret?: string; discountPct?: number; finalAmount?: number; error?: string }
      if (!res.ok) {
        setIntentError("Something went wrong. Please try again.")
        setEmail(null)
        setConfirmed(false)
        return
      }
      setClientSecret(data.clientSecret!)
      setDiscountPct(data.discountPct ?? 0)
      setFinalAmount(data.finalAmount ?? 4700)
    } catch {
      setIntentError("Something went wrong. Please try again.")
      setEmail(null)
      setConfirmed(false)
    } finally {
      setLoadingIntent(false)
    }
  }, [email])

  const handleApplyPromo = useCallback(async (promoCode: string): Promise<{ error: string | null }> => {
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email!, promoCode }),
      })
      const data = await res.json() as { clientSecret?: string; discountPct?: number; finalAmount?: number; error?: string }
      if (!res.ok) {
        return { error: data.error === "Invalid promo code" ? "That promo code isn't valid — please check and try again." : "Something went wrong." }
      }
      setClientSecret(data.clientSecret!)
      setDiscountPct(data.discountPct ?? 0)
      setFinalAmount(data.finalAmount ?? 4700)
      return { error: null }
    } catch {
      return { error: "Something went wrong." }
    }
  }, [email])

  const handleBack = useCallback(() => {
    setEmail(null)
    setConfirmed(false)
    setClientSecret(null)
    setDiscountPct(0)
    setFinalAmount(4700)
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
    <main style={{ background: "#0a0a0a", minHeight: "100vh", color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .checkout-left { padding: 48px 24px 0 !important; border-right: none !important; border-bottom: 1px solid #1a1a1a; }
          .checkout-right { padding: 40px 24px 60px !important; }
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

      {/* Two-column layout */}
      <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 1000, margin: "0 auto", minHeight: "calc(100vh - 61px)" }}>

        {/* LEFT — Course summary */}
        <div className="checkout-left" style={{ padding: "60px 48px 60px 40px", borderRight: "1px solid #1a1a1a" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 8 }}>
            Training Foundations
          </p>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 400, color: "#f0e6d3", lineHeight: 1.2, marginBottom: 8 }}>
            Build the foundation.<br />
            <em>Train for life.</em>
          </h1>

          <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "28px 0", paddingBottom: 28, borderBottom: "1px solid #1a1a1a" }}>
            <span style={{ fontSize: 14, color: "#444", textDecoration: "line-through" }}>$97</span>
            <span style={{ fontSize: 40, fontWeight: 700, color: "#c9a96e", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1 }}>$47</span>
            <span style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c9a96e", border: "1px solid rgba(201,169,110,0.35)", padding: "4px 10px" }}>
              Limited Time
            </span>
          </div>

          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: 20 }}>
            What&apos;s included
          </p>
          <ul style={{ listStyle: "none", marginBottom: 32 }}>
            {MODULES.map((m) => (
              <li key={m.num} style={{ display: "flex", gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid #161616" }}>
                <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 32, fontWeight: 300, color: "rgba(201,169,110,0.2)", lineHeight: 1, flexShrink: 0, width: 32 }}>
                  {m.num}
                </span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#f0e6d3", marginBottom: 4 }}>{m.title}</p>
                  <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>{m.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Includes 50+ exercise videos with full movement breakdowns and form guidance",
              "Built-in workout and progress tracking so you can monitor your strength over time",
              "Lifetime access with free future updates",
              "Designed to be repeated beyond the initial 4 weeks so you can continue building strength and confidence over time",
              "Learn how to train properly for life, not just for 30 days",
              "Instant access after purchase",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#c9a96e", fontSize: 11 }}>✓</span>
                <span style={{ fontSize: 12, color: "#666", letterSpacing: "0.04em" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Payment form */}
        <div className="checkout-right" style={{ padding: "60px 40px 60px 48px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: 28 }}>
            Complete your purchase
          </p>

          {loadingIntent ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#555", fontSize: 13, letterSpacing: "0.1em" }}>
              Preparing secure payment…
            </div>
          ) : email && confirmed && clientSecret ? (
            <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
              <PaymentForm email={email} finalAmount={finalAmount} discountPct={discountPct} onBack={handleBack} onApplyPromo={handleApplyPromo} />
            </Elements>
          ) : email && !confirmed ? (
            <EmailConfirmStep email={email} onConfirm={handleConfirm} onChange={handleBack} />
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

          <p style={{ marginTop: 32, fontSize: 12, color: "#444", lineHeight: 1.8, borderTop: "1px solid #1a1a1a", paddingTop: 24 }}>
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
