"use client"
import { useState, useCallback } from "react"
import Link from "next/link"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js"
import {
  COURSE_PRICE_CENTS, COURSE_PRICE_DISPLAY, COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_CENTS, NUTRITION_COURSE_PRICE_DISPLAY, NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_CENTS, BUNDLE_PRICE_DISPLAY, BUNDLE_INDIVIDUAL_TOTAL_DISPLAY, BUNDLE_SAVINGS_DISPLAY,
  TRACKER_PRICE_CENTS, TRACKER_PRICE_DISPLAY,
} from "@/lib/pricing"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "")

type Product = "training" | "nutrition" | "bundle"

// ─── Product definitions ──────────────────────────────────────────────────────

const PRODUCTS = [
  {
    id: "bundle" as Product,
    name: "Complete Foundations Bundle",
    tagline: "Training and nutrition. Everything you need.",
    includes: ["Training Foundations", "Nutrition Foundations"],
    price: BUNDLE_PRICE_DISPLAY,
    was: BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
    badge: `Save ${BUNDLE_SAVINGS_DISPLAY}`,
  },
  {
    id: "training" as Product,
    name: "Training Foundations",
    tagline: "Build real strength from the ground up.",
    includes: ["4-week structured program", "50+ exercise videos", "Built-in workout tracking"],
    price: COURSE_PRICE_DISPLAY,
    was: COURSE_REGULAR_PRICE_DISPLAY,
    badge: "Limited time",
  },
  {
    id: "nutrition" as Product,
    name: "Nutrition Foundations",
    tagline: "A personalised plan built around your numbers.",
    includes: ["TDEE calculator", "4-week meal plan", "Real attributed recipes"],
    price: NUTRITION_COURSE_PRICE_DISPLAY,
    was: NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
    badge: "Limited time",
  },
]

function basePriceCents(product: Product): number {
  if (product === "bundle") return BUNDLE_PRICE_CENTS
  if (product === "nutrition") return NUTRITION_COURSE_PRICE_CENTS
  return COURSE_PRICE_CENTS
}

function displayTotal(product: Product, withTracker: boolean): string {
  const base = basePriceCents(product)
  const total = base + (withTracker ? TRACKER_PRICE_CENTS : 0)
  return `$${(total / 100).toFixed(0)}`
}

// ─── Payment form ─────────────────────────────────────────────────────────────

function PaymentForm({
  email,
  finalAmount,
  discountPct,
  product,
  onBack,
  onApplyPromo,
}: {
  email: string
  finalAmount: number
  discountPct: number
  product: Product
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
  const [expressReady, setExpressReady] = useState(false)

  const confirmPayment = async () => {
    if (!stripe || !elements) return
    setProcessing(true)
    setError(null)
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/purchase-success?email=${encodeURIComponent(email)}&product=${product}`,
      },
    })
    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.")
      setProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await confirmPayment()
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
  }

  const isFree = discountPct === 100
  const displayAmount = `$${(finalAmount / 100).toFixed(2)}`

  return (
    <form onSubmit={handleSubmit}>
      {discountPct > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.25)", marginBottom: 16 }}>
          <span style={{ color: "#c9a96e", fontSize: 14 }}>✓</span>
          <span style={{ fontSize: 12, color: "#c9a96e", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.08em" }}>
            {isFree ? "Promo code applied: free access ($0.50 processing fee)" : `Promo code applied: ${discountPct}% off`}
          </span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#1a1a1a", border: "1px solid #2a2a2a", marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-montserrat), sans-serif" }}>{email}</span>
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "#c9a96e", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em" }}>
          Change
        </button>
      </div>

      <div style={{ marginBottom: expressReady ? 16 : 0 }}>
        <ExpressCheckoutElement
          options={{
            buttonTheme: { applePay: "white", googlePay: "white" },
            buttonType: { applePay: "buy", googlePay: "buy" },
            paymentMethods: { link: "never", amazonPay: "never" },
            layout: { maxColumns: 2, maxRows: 1, overflow: "never" },
          }}
          onReady={({ availablePaymentMethods }) => setExpressReady(!!availablePaymentMethods)}
          onConfirm={confirmPayment}
        />
      </div>

      {expressReady && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#2a2a2a" }} />
          <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-montserrat), sans-serif", whiteSpace: "nowrap" }}>or pay another way</span>
          <div style={{ flex: 1, height: 1, background: "#2a2a2a" }} />
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <PaymentElement options={{ layout: "tabs", fields: { billingDetails: { name: "auto" } }, wallets: { applePay: "never", googlePay: "never" } }} />
      </div>

      {discountPct === 0 && (
        <div style={{ marginBottom: 20 }}>
          <button type="button" onClick={() => setPromoOpen((o) => !o)} style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
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
              <button type="button" onClick={handleApply} disabled={applyingPromo || !promoCode.trim()} style={{ background: "none", border: "1px solid rgba(201,169,110,0.4)", color: "#c9a96e", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", padding: "0 16px", cursor: applyingPromo ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                {applyingPromo ? "…" : "Apply"}
              </button>
            </div>
          )}
          {promoError && <p style={{ color: "#ff6b6b", fontSize: 12, marginTop: 8, fontFamily: "var(--font-montserrat), sans-serif" }}>{promoError}</p>}
        </div>
      )}

      {error && <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-montserrat), sans-serif" }}>{error}</p>}

      <button type="submit" disabled={!stripe || processing} style={{ width: "100%", background: processing ? "#8a7550" : "#c9a96e", color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", border: "none", padding: "18px 32px", cursor: processing ? "not-allowed" : "pointer", transition: "background 0.2s ease", marginBottom: 16 }}>
        {processing ? "Processing…" : isFree ? "Complete Purchase · $0.50" : `Complete Purchase · ${displayAmount}`}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#555", fontSize: 11, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em" }}>
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><rect x="1" y="6" width="10" height="8" rx="1" stroke="#555" strokeWidth="1.2" /><path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="#555" strokeWidth="1.2" /></svg>
        Secured by Stripe · SSL encrypted
      </div>
    </form>
  )
}

// ─── Email step ───────────────────────────────────────────────────────────────

function EmailStep({ onNext }: { onNext: (email: string, name: string) => void }) {
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim()) { setNameError("Please enter your first name."); return }
    if (!email || !email.includes("@")) { setEmailError("Please enter a valid email address."); return }
    onNext(email.trim().toLowerCase(), firstName.trim())
  }

  return (
    <form onSubmit={handleContinue}>
      <label style={labelStyle}>First Name</label>
      <input type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value); setNameError(null) }} placeholder="Your first name" required style={inputStyle} autoComplete="given-name" />
      {nameError && <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-montserrat), sans-serif" }}>{nameError}</p>}
      <label style={labelStyle}>Email Address</label>
      <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(null) }} placeholder="you@example.com" required style={inputStyle} autoComplete="email" />
      {emailError && <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-montserrat), sans-serif" }}>{emailError}</p>}
      <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.7, marginBottom: 24 }}>
        Your course access will be sent to this email after payment.
      </p>
      <button type="submit" style={ctaButtonStyle}>Continue →</button>
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
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 15, color: "#f0e6d3", letterSpacing: "0.02em" }}>{email}</span>
      </div>
      <p style={{ fontSize: 12, color: "#555", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.7, marginBottom: 28 }}>
        Make sure this is correct. Your login link will be sent here after payment.
      </p>
      <button type="button" onClick={onConfirm} style={{ ...ctaButtonStyle, marginBottom: 12 }}>
        That&apos;s correct, continue to payment →
      </button>
      <button type="button" onClick={onChange} style={{ display: "block", width: "100%", background: "none", border: "none", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 12, letterSpacing: "0.08em", cursor: "pointer", padding: "8px 0", textAlign: "center" }}>
        ← Change email
      </button>
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em",
  textTransform: "uppercase" as const, color: "#888",
  fontFamily: "var(--font-montserrat), sans-serif", marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
  color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 16,
  padding: "14px 16px", outline: "none", marginBottom: 16, boxSizing: "border-box" as const,
}

const ctaButtonStyle: React.CSSProperties = {
  width: "100%", background: "#c9a96e", color: "#0a0a0a",
  fontFamily: "var(--font-montserrat), sans-serif", fontSize: 12, fontWeight: 600,
  letterSpacing: "0.2em", textTransform: "uppercase" as const, border: "none", padding: "18px 32px", cursor: "pointer",
}

// ─── Root component ───────────────────────────────────────────────────────────

export function CheckoutClient({ product: initialProduct = "bundle", memberDiscount = false }: { product?: Product; memberDiscount?: boolean }) {
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProduct)
  const [includesTracker, setIncludesTracker] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [discountPct, setDiscountPct] = useState(0)
  const [finalAmount, setFinalAmount] = useState(basePriceCents(initialProduct))
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [intentError, setIntentError] = useState<string | null>(null)

  const paymentStarted = !!clientSecret

  const handleSelectProduct = (p: Product) => {
    if (p === selectedProduct) return
    setSelectedProduct(p)
    setClientSecret(null)
    setDiscountPct(0)
    setConfirmed(false)
    setFinalAmount(basePriceCents(p) + (includesTracker ? TRACKER_PRICE_CENTS : 0))
  }

  const handleToggleTracker = () => {
    if (paymentStarted) return
    const next = !includesTracker
    setIncludesTracker(next)
    setClientSecret(null)
    setConfirmed(false)
    setFinalAmount(basePriceCents(selectedProduct) + (next ? TRACKER_PRICE_CENTS : 0))
  }

  const handleEmailNext = useCallback((submittedEmail: string, submittedName: string) => {
    setEmail(submittedEmail)
    setName(submittedName)
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
        body: JSON.stringify({ email, name, includesTracker, product: selectedProduct, memberDiscount }),
      })
      const data = await res.json() as { clientSecret?: string; discountPct?: number; finalAmount?: number; error?: string }
      if (!res.ok) {
        setIntentError("Something went wrong. Please try again.")
        setEmail(null); setConfirmed(false); return
      }
      setClientSecret(data.clientSecret!)
      setDiscountPct(data.discountPct ?? 0)
      setFinalAmount(data.finalAmount ?? (basePriceCents(selectedProduct) + (includesTracker ? TRACKER_PRICE_CENTS : 0)))
    } catch {
      setIntentError("Something went wrong. Please try again.")
      setEmail(null); setConfirmed(false)
    } finally {
      setLoadingIntent(false)
    }
  }, [email, name, includesTracker, selectedProduct, memberDiscount])

  const handleApplyPromo = useCallback(async (promoCode: string): Promise<{ error: string | null }> => {
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email!, name: name!, promoCode, includesTracker, product: selectedProduct, memberDiscount }),
      })
      const data = await res.json() as { clientSecret?: string; discountPct?: number; finalAmount?: number; error?: string }
      if (!res.ok) return { error: data.error === "Invalid promo code" ? "That promo code isn't valid. Please check and try again." : "Something went wrong." }
      setClientSecret(data.clientSecret!)
      setDiscountPct(data.discountPct ?? 0)
      setFinalAmount(data.finalAmount ?? (basePriceCents(selectedProduct) + (includesTracker ? TRACKER_PRICE_CENTS : 0)))
      return { error: null }
    } catch {
      return { error: "Something went wrong." }
    }
  }, [email, name, includesTracker, selectedProduct, memberDiscount])

  const handleBack = useCallback(() => {
    setEmail(null); setName(null); setConfirmed(false)
    setClientSecret(null); setDiscountPct(0)
    setFinalAmount(basePriceCents(selectedProduct) + (includesTracker ? TRACKER_PRICE_CENTS : 0))
  }, [selectedProduct, includesTracker])

  const stripeAppearance = {
    theme: "night" as const,
    variables: { colorPrimary: "#c9a96e", colorBackground: "#161616", colorText: "#f0e6d3", colorTextSecondary: "#888888", colorDanger: "#ff6b6b", fontFamily: "Montserrat, system-ui, sans-serif", borderRadius: "0px", spacingUnit: "4px" },
    rules: {
      ".Input": { border: "1px solid #2a2a2a", backgroundColor: "#1a1a1a" },
      ".Input:focus": { border: "1px solid #c9a96e", boxShadow: "none" },
      ".Label": { color: "#888888", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "10px" },
      ".Tab": { border: "1px solid #2a2a2a", backgroundColor: "#161616" },
      ".Tab--selected": { border: "1px solid #c9a96e", color: "#c9a96e" },
    },
  }

  const isBundle = selectedProduct === "bundle"

  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh", color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .checkout-left  { padding: 48px 24px 32px !important; border-right: none !important; border-bottom: 1px solid #1a1a1a; }
          .checkout-right { padding: 40px 24px 60px !important; }
        }
        .product-card {
          border: 1px solid #1e1e1e;
          padding: 22px 24px;
          cursor: pointer;
          transition: border-color 0.15s;
          background: #0d0d0d;
          margin-bottom: 8px;
        }
        .product-card:hover:not(.product-card--disabled) { border-color: rgba(201,169,110,0.35); }
        .product-card--selected { border: 2px solid #c9a96e !important; background: rgba(201,169,110,0.04) !important; }
        .product-card--disabled { opacity: 0.38; cursor: default; pointer-events: none; }
        .tracker-card {
          border: 1px solid #1e1e1e;
          padding: 18px 24px;
          cursor: pointer;
          transition: border-color 0.15s;
          background: #0d0d0d;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .tracker-card:hover { border-color: rgba(201,169,110,0.35); }
        .tracker-card--added { border: 2px solid rgba(201,169,110,0.5) !important; background: rgba(201,169,110,0.04) !important; }
      `}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #1a1a1a" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 20, fontWeight: 600, color: "#f0e6d3", letterSpacing: "0.05em" }}>
            Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#555", letterSpacing: "0.1em" }}>
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><rect x="0.5" y="5" width="9" height="7" rx="1" stroke="#555" strokeWidth="1" /><path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="#555" strokeWidth="1" /></svg>
          SECURE CHECKOUT
        </div>
      </div>

      <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 1000, margin: "0 auto", minHeight: "calc(100vh - 61px)" }}>

        {/* LEFT — Product selection */}
        <div className="checkout-left" style={{ padding: "52px 48px 52px 40px", borderRight: "1px solid #1a1a1a" }}>

          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "#555", marginBottom: 24 }}>
            Select your course
          </p>

          {/* Product cards */}
          {PRODUCTS.map((p) => {
            const isSelected = selectedProduct === p.id
            const isDisabled = isBundle && p.id !== "bundle"
            return (
              <div
                key={p.id}
                className={`product-card${isSelected ? " product-card--selected" : ""}${isDisabled ? " product-card--disabled" : ""}`}
                onClick={() => !isDisabled && handleSelectProduct(p.id)}
                role="radio"
                aria-checked={isSelected}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 18, fontWeight: 600, color: isSelected ? "#f0e6d3" : "#aaa", lineHeight: 1.2, marginBottom: 3 }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: 11, color: "#555", lineHeight: 1.4 }}>{p.tagline}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: "#c9a96e", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1 }}>{p.price}</p>
                    <p style={{ fontSize: 11, color: "#444", textDecoration: "line-through", marginTop: 2 }}>{p.was}</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
                  {isDisabled ? (
                    <span style={{ fontSize: 10, color: "#c9a96e", letterSpacing: "0.1em" }}>✓ Included in bundle</span>
                  ) : (
                    p.includes.map((item) => (
                      <span key={item} style={{ fontSize: 10, color: isSelected ? "rgba(240,230,211,0.45)" : "#444", letterSpacing: "0.04em" }}>{item}</span>
                    ))
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c9a96e", border: "1px solid rgba(201,169,110,0.3)", padding: "3px 8px" }}>
                    {p.badge}
                  </span>
                  {isSelected ? (
                    <span style={{ fontSize: 10, color: "#c9a96e", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 12 }}>●</span> Selected
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em" }}>Select →</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Tracker add-on */}
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#444", marginBottom: 10 }}>
              Optional add-on
            </p>
            <div
              className={`tracker-card${includesTracker ? " tracker-card--added" : ""}`}
              onClick={handleToggleTracker}
              style={{ cursor: paymentStarted ? "default" : "pointer" }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: includesTracker ? "#f0e6d3" : "#888", fontFamily: "var(--font-cormorant), serif", marginBottom: 2 }}>
                  Progress Tracker
                </p>
                <p style={{ fontSize: 11, color: "#555" }}>Log every workout. Beat last week.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: includesTracker ? "#c9a96e" : "#666", fontFamily: "var(--font-montserrat), sans-serif" }}>+{TRACKER_PRICE_DISPLAY}</span>
                <input
                  type="checkbox"
                  checked={includesTracker}
                  disabled={paymentStarted}
                  onChange={handleToggleTracker}
                  onClick={(e) => e.stopPropagation()}
                  style={{ accentColor: "#c9a96e", width: 16, height: 16, cursor: paymentStarted ? "default" : "pointer" }}
                />
              </div>
            </div>
          </div>

          {/* Order total */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#444" }}>Order total</span>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#c9a96e", fontFamily: "var(--font-montserrat), sans-serif" }}>
                {displayTotal(selectedProduct, includesTracker)}
              </span>
              <span style={{ fontSize: 10, color: "#444", marginLeft: 8, letterSpacing: "0.08em" }}>one-time</span>
            </div>
          </div>

        </div>

        {/* RIGHT — Payment form */}
        <div className="checkout-right" style={{ padding: "52px 40px 52px 48px" }}>

          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: 28 }}>
            Complete your purchase
          </p>

          {loadingIntent ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#555", fontSize: 13, letterSpacing: "0.1em" }}>
              Preparing secure payment…
            </div>
          ) : email && confirmed && clientSecret ? (
            <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
              <PaymentForm email={email} finalAmount={finalAmount} discountPct={discountPct} product={selectedProduct} onBack={handleBack} onApplyPromo={handleApplyPromo} />
            </Elements>
          ) : email && !confirmed ? (
            <EmailConfirmStep email={email} onConfirm={handleConfirm} onChange={handleBack} />
          ) : (
            <>
              {intentError && <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-montserrat), sans-serif" }}>{intentError}</p>}
              <EmailStep onNext={handleEmailNext} />
            </>
          )}

          <p style={{ marginTop: 32, fontSize: 12, color: "#444", lineHeight: 1.8, borderTop: "1px solid #1a1a1a", paddingTop: 24 }}>
            After payment, you&apos;ll receive an email with your login credentials. Use them at{" "}
            <Link href="/login" style={{ color: "#c9a96e", textDecoration: "none" }}>lisafitmethod.com/login</Link>
            {" "}to access your course.
          </p>
        </div>
      </div>
    </main>
  )
}
