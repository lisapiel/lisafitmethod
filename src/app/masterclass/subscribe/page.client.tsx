"use client"

import { useState, useCallback, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { fetchUserAttributes } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  MASTERCLASS_MONTHLY_CENTS, MASTERCLASS_6MONTH_CENTS, MASTERCLASS_ANNUAL_CENTS,
  MASTERCLASS_MONTHLY_DISPLAY, MASTERCLASS_6MONTH_DISPLAY, MASTERCLASS_ANNUAL_DISPLAY,
  MASTERCLASS_6MONTH_PER_MONTH_DISPLAY, MASTERCLASS_ANNUAL_PER_MONTH_DISPLAY,
} from "@/lib/pricing"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "")

type Plan = "monthly" | "6month" | "annual"

const PLANS: { id: Plan; label: string; price: string; perMonth?: string; billing: string; badge?: string; cents: number }[] = [
  {
    id: "annual",
    label: "Annual",
    price: MASTERCLASS_ANNUAL_DISPLAY,
    perMonth: MASTERCLASS_ANNUAL_PER_MONTH_DISPLAY + "/mo",
    billing: "billed once a year",
    badge: "Most Popular",
    cents: MASTERCLASS_ANNUAL_CENTS,
  },
  {
    id: "6month",
    label: "6 Months",
    price: MASTERCLASS_6MONTH_DISPLAY,
    perMonth: MASTERCLASS_6MONTH_PER_MONTH_DISPLAY + "/mo",
    billing: "billed every 6 months",
    cents: MASTERCLASS_6MONTH_CENTS,
  },
  {
    id: "monthly",
    label: "Monthly",
    price: MASTERCLASS_MONTHLY_DISPLAY + "/mo",
    billing: "billed monthly, cancel anytime",
    cents: MASTERCLASS_MONTHLY_CENTS,
  },
]

// ─── Payment form (inside Elements provider) ──────────────────────────────────

function PaymentForm({
  email,
  plan: _plan, // eslint-disable-line @typescript-eslint/no-unused-vars
  onBack,
}: {
  email: string
  plan: Plan
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/masterclass?subscribed=1`,
        receipt_email: email,
      },
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message ?? "Payment failed. Please try again.")
      setLoading(false)
      return
    }

    router.push("/masterclass?subscribed=1")
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 28 }}>
        <PaymentElement
          options={{
            layout: "tabs",
            fields: { billingDetails: { email: "never" } },
          }}
        />
      </div>
      {error && (
        <p style={{ color: "#e07070", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-montserrat), sans-serif" }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !stripe}
        style={{
          width: "100%",
          background: loading ? "#555" : "#c9a96e",
          color: loading ? "#888" : "#0a0a0a",
          border: "none",
          padding: "16px 24px",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--font-montserrat), sans-serif",
          transition: "background 0.2s",
        }}
      >
        {loading ? "Processing…" : "Subscribe Now"}
      </button>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "block",
          width: "100%",
          marginTop: 12,
          background: "none",
          border: "none",
          color: "#555",
          fontSize: "0.65rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: "var(--font-montserrat), sans-serif",
        }}
      >
        ← Change Plan
      </button>
    </form>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function SubscribeClient() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual")
  const [email, setEmail] = useState("")
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefilling, setPrefilling] = useState(true)

  useEffect(() => {
    fetchUserAttributes()
      .then((attrs) => {
        if (attrs.email) setEmail(attrs.email)
      })
      .catch(() => {})
      .finally(() => setPrefilling(false))
  }, [])

  const handleContinue = useCallback(async () => {
    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), plan: selectedPlan }),
      })
      const data = await res.json() as { clientSecret?: string; error?: string }
      if (!res.ok || data.error || !data.clientSecret) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }
      setClientSecret(data.clientSecret)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [email, selectedPlan])

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan)!

  const stripeAppearance = {
    theme: "night" as const,
    variables: {
      colorPrimary: "#c9a96e",
      colorBackground: "#161616",
      colorText: "#f0e6d3",
      colorDanger: "#e07070",
      fontFamily: "var(--font-montserrat), sans-serif",
      borderRadius: "2px",
    },
    rules: {
      ".Input": { border: "1px solid #2a2a2a", padding: "12px 14px" },
      ".Label": { fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "6px" },
    },
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "var(--font-montserrat), sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 600, color: "#f0e6d3" }}>
              Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
            </span>
          </Link>
          <p style={{ fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "#555", marginTop: 8 }}>
            Masterclass
          </p>
        </div>

        {!clientSecret ? (
          <div>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(28px, 6vw, 36px)", fontWeight: 400, color: "#f0e6d3", lineHeight: 1.2, marginBottom: 8, textAlign: "center" }}>
              Choose your plan.
            </h1>
            <p style={{ fontSize: 13, color: "#666", textAlign: "center", marginBottom: 36, lineHeight: 1.6 }}>
              Fresh programming every month. 361 exercise videos. Q&A answered monthly.
            </p>

            {/* Plan tiles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      background: isSelected ? "#161616" : "#0e0e0e",
                      border: isSelected ? "1px solid #c9a96e" : "1px solid #2a2a2a",
                      borderRadius: 2,
                      padding: "20px 24px",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "border-color 0.15s",
                      position: "relative",
                    }}
                  >
                    {plan.badge && (
                      <span style={{
                        position: "absolute",
                        top: -10,
                        right: 16,
                        background: "#c9a96e",
                        color: "#0a0a0a",
                        fontSize: "0.55rem",
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        padding: "3px 10px",
                      }}>
                        {plan.badge}
                      </span>
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: isSelected ? "#c9a96e" : "#888" }}>
                        {plan.label}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.6rem", color: "#555", letterSpacing: "0.05em" }}>
                        {plan.billing}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif" }}>
                        {plan.price}
                      </p>
                      {plan.perMonth && (
                        <p style={{ margin: "2px 0 0", fontSize: "0.6rem", color: "#666" }}>
                          {plan.perMonth}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Email input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={prefilling}
                placeholder="your@email.com"
                style={{
                  width: "100%",
                  background: "#161616",
                  border: "1px solid #2a2a2a",
                  color: "#f0e6d3",
                  padding: "12px 14px",
                  fontSize: 14,
                  fontFamily: "var(--font-montserrat), sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <p style={{ color: "#e07070", fontSize: 13, marginBottom: 16 }}>{error}</p>
            )}

            <button
              onClick={handleContinue}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#555" : "#c9a96e",
                color: loading ? "#888" : "#0a0a0a",
                border: "none",
                padding: "16px 24px",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-montserrat), sans-serif",
              }}
            >
              {loading ? "Setting up…" : `Continue — ${selectedPlanData.price}`}
            </button>

            <p style={{ fontSize: 11, color: "#444", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
              Cancel anytime. No contracts.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 28, padding: "16px 20px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 2 }}>
              <p style={{ margin: 0, fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a96e" }}>
                {selectedPlanData.label} Plan
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "1.1rem", fontWeight: 700, color: "#f0e6d3" }}>
                {selectedPlanData.price}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>{selectedPlanData.billing}</p>
            </div>

            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: stripeAppearance }}
            >
              <PaymentForm
                email={email}
                plan={selectedPlan}
                onBack={() => setClientSecret(null)}
              />
            </Elements>
          </div>
        )}

        <p style={{ fontSize: 11, color: "#333", textAlign: "center", marginTop: 32 }}>
          Already subscribed?{" "}
          <Link href="/masterclass" style={{ color: "#c9a96e", textDecoration: "none" }}>
            Go to Masterclass →
          </Link>
        </p>
      </div>
    </div>
  )
}
