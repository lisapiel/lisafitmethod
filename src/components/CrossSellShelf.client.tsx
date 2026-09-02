"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { COURSE_PRICE_CENTS, NUTRITION_COURSE_PRICE_CENTS, TRACKER_PRICE_CENTS } from "@/lib/pricing"

// Raw ownership (no admin bypass, no coaching side-effect grants). This is
// what determines whether a customer already owns a separately-sold
// product — admin bypass shouldn't hide upsells from Lisa when she's
// browsing as herself, and coaching access shouldn't unlock the courses.
interface RawOwnership {
  training: boolean
  nutrition: boolean
  tracker: boolean
  coaching: boolean
}

interface AccessResponse {
  owns?: Partial<RawOwnership>
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

// Fixed priority order for the bottom-of-course upsell shelf:
//   1. 1:1 Coaching       — top of the shelf when the viewer doesn't
//                            already have active coaching.
//   2. Unowned course     — the other course they don't own (Nutrition
//                            if they're inside Training, Training if
//                            they're inside Nutrition).
//   3. Progress Tracker   — always last; the smallest add-on.
// Every entry is gated on RAW ownership so admin bypass never hides
// an upsell, and coaching access never unlocks the courses.
// Masterclass is deliberately not surfaced here.
export default function CrossSellShelf({ currentProduct }: CrossSellShelfProps) {
  const [owns, setOwns] = useState<RawOwnership | null>(null)

  useEffect(() => {
    fetch("/api/member/access")
      .then((r) => r.json())
      .then((d: AccessResponse) => setOwns({
        training:  !!d.owns?.training,
        nutrition: !!d.owns?.nutrition,
        tracker:   !!d.owns?.tracker,
        coaching:  !!d.owns?.coaching,
      }))
      .catch(() => {})
  }, [])

  if (!owns) return null

  type Upsell = {
    product: "coaching" | "training" | "nutrition" | "tracker"
    label: string
    headline: string
    desc: string
    priceText: string      // right-hand price display (may include /mo, "from", strikethrough, etc.)
    ctaText: string
    href: string
  }
  const upsells: Upsell[] = []

  // 1. 1:1 Coaching first (unless they already have it)
  if (!owns.coaching) {
    upsells.push({
      product: "coaching",
      label: "1:1 Coaching",
      headline: "Ready for a coach in your corner?",
      desc: "A personalized program built around your goals, weekly check-ins, form feedback, and direct messaging with me. Application-only.",
      priceText: "From $397/mo",
      ctaText: "Apply for Coaching",
      href: "/coaching",
    })
  }

  // 2. The other course they don't own yet
  const otherCourse: "training" | "nutrition" = currentProduct === "training" ? "nutrition" : "training"
  if (!owns[otherCourse]) {
    if (otherCourse === "nutrition") {
      upsells.push({
        product: "nutrition",
        label: "Nutrition Foundations",
        headline: "Put the training to work",
        desc: "4-week nutrition course with personalized TDEE calculator, meal plan, and real recipes. One payment, ongoing access.",
        priceText: `${centsToDisplay(discountedPrice(NUTRITION_COURSE_PRICE_CENTS))} · was ${centsToDisplay(NUTRITION_COURSE_PRICE_CENTS)}`,
        ctaText: "Add to Account",
        href: "/checkout?product=nutrition&member=1",
      })
    } else {
      upsells.push({
        product: "training",
        label: "Training Foundations",
        headline: "Pair it with a real program",
        desc: "4-week beginner strength training. Five foundational movements, progressive overload, built-in workout tracking.",
        priceText: `${centsToDisplay(discountedPrice(COURSE_PRICE_CENTS))} · was ${centsToDisplay(COURSE_PRICE_CENTS)}`,
        ctaText: "Add to Account",
        href: "/checkout?member=1",
      })
    }
  }

  // 3. Progress Tracker last (unless they already own it)
  if (!owns.tracker) {
    upsells.push({
      product: "tracker",
      label: "Progress Tracker",
      headline: "Your workout app, built in",
      desc: "Build any program, log every lift, beat last week's numbers. Installs to your home screen. No subscription, ever.",
      priceText: `${centsToDisplay(discountedPrice(TRACKER_PRICE_CENTS))} · was ${centsToDisplay(TRACKER_PRICE_CENTS)}`,
      ctaText: "Add Progress Tracker",
      href: "/tracker-checkout",
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
        Keep going · offers for existing customers
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {upsells.map((u) => (
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
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", fontWeight: 700, color: gold }}>
                  {u.priceText}
                </span>
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
                {u.ctaText}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
