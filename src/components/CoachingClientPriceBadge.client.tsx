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

const CHECKOUT_PATH: Record<ProductKey, string> = {
  training: "/checkout?product=training",
  nutrition: "/checkout?product=nutrition",
  tracker: "/tracker-checkout",
}

// Subtle, restrained badge that appears only for authenticated active
// coaching clients on the public sales pages. Pricing is display-only — the
// server-side Stripe PaymentIntent routes independently re-check the raw
// coaching_access record from the authenticated session before charging.
export default function CoachingClientPriceBadge({ product }: { product: ProductKey }) {
  const [offer, setOffer] = useState<OfferShape | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/member/access")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (cancelled) return
        const offers = d?.offers as AccessOffers | undefined
        if (offers?.coachingClient?.eligible) {
          const o = offers.coachingClient[product]
          if (o) setOffer(o)
        }
      })
      .catch(() => { /* silent — logged-out / non-eligible sees regular pricing */ })
    return () => { cancelled = true }
  }, [product])

  if (!offer) return null

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
