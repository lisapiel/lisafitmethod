"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type ProductKey = "training" | "nutrition" | "tracker"

interface OfferShape {
  regularCents: number
  regularDisplay: string
  clientCents: number
  clientDisplay: string
}

interface AccessOffers {
  coachingClient: {
    eligible: boolean
    training: OfferShape | null
    nutrition: OfferShape | null
    tracker: OfferShape | null
  }
}
interface AccessResponse {
  offers?: AccessOffers
  owns?: { training?: boolean; nutrition?: boolean; tracker?: boolean }
}

const CHECKOUT_PATH: Record<ProductKey, string> = {
  training: "/checkout?product=training",
  nutrition: "/checkout?product=nutrition",
  tracker: "/tracker-checkout",
}
const PORTAL_PATH: Record<ProductKey, string> = {
  training: "/training-foundations",
  nutrition: "/nutrition-foundations",
  tracker: "/my-tracker",
}
const PRODUCT_LABEL: Record<ProductKey, string> = {
  training: "Training Foundations",
  nutrition: "Nutrition Foundations",
  tracker: "Progress Tracker",
}

// Subtle, restrained badge on the public sales pages. Renders in one of three
// states based on the authenticated viewer:
//   - Not eligible / logged out: nothing at all (public sees the regular
//     hero price on the rest of the page).
//   - Eligible + doesn't own the product: "Your coaching client price"
//     with the discount + purchase CTA.
//   - Already owns the product: "You already own X — Open →" state, never
//     a purchase CTA. Ownership check uses the raw entitlement (no admin
//     auto-grant) via /api/member/access `owns.*`.
export default function CoachingClientPriceBadge({ product }: { product: ProductKey }) {
  const [state, setState] = useState<
    | { kind: "hidden" }
    | { kind: "offer"; offer: OfferShape }
    | { kind: "owned" }
  >({ kind: "hidden" })

  useEffect(() => {
    let cancelled = false
    fetch("/api/member/access")
      .then((r) => r.ok ? r.json() : null)
      .then((d: AccessResponse | null) => {
        if (cancelled) return
        if (d?.owns?.[product] === true) {
          setState({ kind: "owned" })
          return
        }
        if (d?.offers?.coachingClient?.eligible) {
          const o = d.offers.coachingClient[product]
          if (o) setState({ kind: "offer", offer: o })
        }
      })
      .catch(() => { /* silent — logged-out sees regular hero pricing */ })
    return () => { cancelled = true }
  }, [product])

  if (state.kind === "hidden") return null

  if (state.kind === "owned") {
    return (
      <div style={{
        background: "rgba(92, 158, 106, 0.08)",
        border: "1px solid rgba(92, 158, 106, 0.35)",
        borderRadius: 6,
        padding: "14px 18px",
        margin: "0 auto 20px",
        maxWidth: 560,
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "var(--font-montserrat), 'Helvetica Neue', sans-serif",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#5c9e6a", margin: "0 0 6px",
        }}>
          You already own this
        </p>
        <p style={{
          fontFamily: "var(--font-montserrat), 'Helvetica Neue', sans-serif",
          fontSize: 15, color: "#1a1a1a", margin: "0 0 10px", lineHeight: 1.5,
        }}>
          You already own <strong>{PRODUCT_LABEL[product]}</strong>.
        </p>
        <Link
          href={PORTAL_PATH[product]}
          style={{
            display: "inline-block", background: "#0a0a0a", color: "#f5f2ee",
            padding: "8px 20px",
            fontFamily: "var(--font-montserrat), 'Helvetica Neue', sans-serif",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase",
            textDecoration: "none", borderRadius: 3,
          }}
        >
          Open {PRODUCT_LABEL[product]} →
        </Link>
      </div>
    )
  }

  const { offer } = state
  return (
    <div style={{
      background: "rgba(201, 169, 110, 0.08)",
      border: "1px solid rgba(201, 169, 110, 0.35)",
      borderRadius: 6,
      padding: "14px 18px",
      margin: "0 auto 20px",
      maxWidth: 560,
      textAlign: "center",
    }}>
      <p style={{
        fontFamily: "var(--font-montserrat), 'Helvetica Neue', sans-serif",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
        color: "#c9a96e", margin: "0 0 4px",
      }}>
        Your coaching client price
      </p>
      <p style={{
        fontFamily: "var(--font-montserrat), 'Helvetica Neue', sans-serif",
        fontSize: 15, color: "#1a1a1a", margin: "0 0 8px", lineHeight: 1.5,
      }}>
        <strong style={{ fontSize: 18, color: "#0a0a0a" }}>{offer.clientDisplay}</strong>{" "}
        <span style={{ color: "#888", textDecoration: "line-through", fontSize: 13 }}>{offer.regularDisplay}</span>
        <span style={{ color: "#666", marginLeft: 8, fontSize: 13 }}>· one-time · lifetime access</span>
      </p>
      <Link
        href={CHECKOUT_PATH[product]}
        style={{
          display: "inline-block", background: "#c9a97e", color: "#0a0a0a",
          padding: "8px 20px",
          fontFamily: "var(--font-montserrat), 'Helvetica Neue', sans-serif",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase",
          textDecoration: "none", borderRadius: 3,
        }}
      >
        Add at coaching client price →
      </Link>
      <p style={{ fontSize: 11, color: "#888", margin: "10px 0 0", fontFamily: "var(--font-montserrat), 'Helvetica Neue', sans-serif" }}>
        Available separately at a preferred price while your coaching is active.
      </p>
    </div>
  )
}
