"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

interface MemberAccess {
  email: string | null
  training: boolean
  nutrition: boolean
  tracker: boolean
}

interface CrossSellShelfProps {
  currentProduct: "training" | "nutrition"
}

const MEMBER_OFF = 10

function discountedPrice(cents: number) {
  return Math.round(cents * (1 - MEMBER_OFF / 100))
}

function centsToDisplay(cents: number) {
  return `$${Math.round(cents / 100)}`
}

export default function CrossSellShelf({ currentProduct }: CrossSellShelfProps) {
  const [access, setAccess] = useState<MemberAccess | null>(null)

  useEffect(() => {
    fetch("/api/member/access")
      .then((r) => r.json())
      .then((d: MemberAccess) => setAccess(d))
      .catch(() => {})
  }, [])

  if (!access) return null

  const upsells: Array<{
    product: "training" | "nutrition" | "tracker"
    label: string
    headline: string
    desc: string
    baseCents: number
    href: string
  }> = []

  if (currentProduct === "training" && !access.nutrition) {
    upsells.push({
      product: "nutrition",
      label: "Nutrition Foundations",
      headline: "Put the training to work",
      desc: "4-week nutrition course with personalized TDEE calculator, meal plan, and real recipes. One payment, yours forever.",
      baseCents: 7700,
      href: "/checkout?product=nutrition&member=1",
    })
  }

  if (currentProduct === "nutrition" && !access.training) {
    upsells.push({
      product: "training",
      label: "Training Foundations",
      headline: "Pair it with a real program",
      desc: "4-week beginner strength training. Five foundational movements, progressive overload, built-in workout tracking.",
      baseCents: 9700,
      href: "/checkout?member=1",
    })
  }

  if (currentProduct === "training" && !access.tracker) {
    upsells.push({
      product: "tracker",
      label: "Progress Tracker",
      headline: "Keep progressing after 4 weeks",
      desc: "Build your own workout days, log every lift, and always know the number you're trying to beat. Lifetime access.",
      baseCents: 2700,
      href: "/checkout?member=1#tracker",
    })
  }

  if (upsells.length === 0) return null

  const gold = "#c9a96e"
  const border = "#2a2a2a"

  return (
    <div style={{ borderTop: `1px solid ${border}`, marginTop: "3rem", paddingTop: "2.5rem" }}>
      <p style={{
        fontFamily: "var(--font-montserrat), sans-serif",
        fontSize: "0.6rem",
        fontWeight: 600,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: "#555",
        marginBottom: "1.5rem",
      }}>
        Member pricing — {MEMBER_OFF}% off for existing customers
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {upsells.map((u) => {
          const discCents = discountedPrice(u.baseCents)
          return (
            <div
              key={u.product}
              style={{
                background: "#111",
                border: `1px solid ${border}`,
                borderLeft: `3px solid ${gold}`,
                padding: "1.5rem 1.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1.5rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: gold,
                  marginBottom: "0.4rem",
                }}>
                  {u.label}
                </p>
                <p style={{
                  fontFamily: "var(--font-cormorant), serif",
                  fontSize: "1.2rem",
                  fontWeight: 300,
                  color: "#f0e6d3",
                  marginBottom: "0.4rem",
                }}>
                  {u.headline}
                </p>
                <p style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.75rem",
                  color: "#888",
                  lineHeight: 1.6,
                }}>
                  {u.desc}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555", textDecoration: "line-through" }}>{centsToDisplay(u.baseCents)}</span>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "1.4rem", fontWeight: 700, color: gold }}>{centsToDisplay(discCents)}</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>member price</p>
                </div>
                <Link
                  href={u.href}
                  style={{
                    display: "inline-block",
                    background: gold,
                    color: "#0a0a0a",
                    fontFamily: "var(--font-montserrat), sans-serif",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    padding: "0.65rem 1.25rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  Add to Account
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
