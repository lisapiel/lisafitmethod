"use client"
import Link from "next/link"
import AccountDropdown from "@/components/AccountDropdown.client"
import {
  COURSE_PRICE_DISPLAY, COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_DISPLAY, NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY, BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  TRACKER_PRICE_DISPLAY,
} from "@/lib/pricing"

const gold = "#c9a96e"
const border = "#2a2a2a"

interface Props {
  email: string
  training: boolean
  nutrition: boolean
  tracker: boolean
  masterclass: boolean
  isAdmin: boolean
}

interface OwnedProduct {
  id: string
  label: string
  desc: string
  href: string
  icon: string
}

interface UpsellProduct {
  id: string
  label: string
  desc: string
  price: string
  regularPrice: string
  href: string
  featured?: boolean
}

export function AccountClient({ email, training, nutrition, tracker, masterclass, isAdmin }: Props) {

  const owned: OwnedProduct[] = []
  if (masterclass && isAdmin) {
    owned.push({
      id: "masterclass",
      label: "Masterclass",
      desc: "Monthly programming, 361 exercise videos, Q&A with Lisa. New block every month.",
      href: "/masterclass",
      icon: "MC",
    })
  }
  if (training) {
    owned.push({
      id: "training",
      label: "Training Foundations",
      desc: "4-week beginner strength program. 5 movements, progressive overload, workout tracking.",
      href: "/training-foundations",
      icon: "TF",
    })
  }
  if (nutrition) {
    owned.push({
      id: "nutrition",
      label: "Nutrition Foundations",
      desc: "4-week nutrition course with TDEE calculator, meal plan, and real verified recipes.",
      href: "/nutrition-foundations",
      icon: "NF",
    })
  }
  if (tracker) {
    owned.push({
      id: "tracker",
      label: "Progress Tracker",
      desc: "Workout tracker. Build custom days, log every lift, track progress over time.",
      href: "/my-tracker",
      icon: "PT",
    })
  }

  const upsells: UpsellProduct[] = []
  if (!training && !nutrition) {
    upsells.push({
      id: "bundle",
      label: "Foundations Bundle",
      desc: "Training + Nutrition together. The complete system.",
      price: BUNDLE_PRICE_DISPLAY,
      regularPrice: BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
      href: "/checkout?product=bundle",
      featured: true,
    })
    upsells.push({
      id: "training",
      label: "Training Foundations",
      desc: "4-week beginner strength program.",
      price: COURSE_PRICE_DISPLAY,
      regularPrice: COURSE_REGULAR_PRICE_DISPLAY,
      href: "/checkout",
    })
    upsells.push({
      id: "nutrition",
      label: "Nutrition Foundations",
      desc: "4-week nutrition course.",
      price: NUTRITION_COURSE_PRICE_DISPLAY,
      regularPrice: NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
      href: "/checkout?product=nutrition",
    })
  } else if (training && !nutrition) {
    upsells.push({
      id: "nutrition",
      label: "Nutrition Foundations",
      desc: "Pair training with the right nutrition. 4-week course, personalized TDEE calculator.",
      price: "$69",
      regularPrice: NUTRITION_COURSE_PRICE_DISPLAY,
      href: "/checkout?product=nutrition&member=1",
      featured: true,
    })
  } else if (nutrition && !training) {
    upsells.push({
      id: "training",
      label: "Training Foundations",
      desc: "Put the nutrition to work. 4-week beginner strength program.",
      price: "$87",
      regularPrice: COURSE_PRICE_DISPLAY,
      href: "/checkout?member=1",
      featured: true,
    })
  }
  if (isAdmin && training && !masterclass) {
    upsells.push({
      id: "masterclass",
      label: "Masterclass",
      desc: "New 3-day block every month. 361 exercise videos. Monthly Q&A. From $16.42/mo on annual.",
      price: "From $197/yr",
      regularPrice: "",
      href: "/masterclass-info",
      featured: true,
    })
  }
  if (training && !tracker) {
    upsells.push({
      id: "tracker",
      label: "Progress Tracker",
      desc: "Build any workout, log every lift, beat last week's numbers. Installs like an app on your home screen. Buy once. No subscription, ever.",
      price: TRACKER_PRICE_DISPLAY,
      regularPrice: TRACKER_PRICE_DISPLAY,
      href: "/tracker-checkout",
    })
  }

  return (
    <main style={{
      background: "#0a0a0a",
      minHeight: "100vh",
      fontFamily: "var(--font-montserrat), sans-serif",
      color: "#f0e6d3",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${border}`,
        padding: "0 40px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/account" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 20, fontWeight: 600, color: "#f0e6d3" }}>
            Lisa <span style={{ color: gold }}>Fit Method</span>
          </span>
        </Link>
        <AccountDropdown />
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Account label */}
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>My Account</p>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 300, color: "#f0e6d3", marginBottom: 4 }}>
          Welcome back.
        </p>
        <p style={{ fontSize: "0.75rem", color: "#555", marginBottom: 40 }}>{email}</p>

        {/* Owned courses */}
        {owned.length > 0 ? (
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
              Your Courses
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {owned.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "#111",
                    border: `1px solid ${border}`,
                    borderLeft: `3px solid ${gold}`,
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 6 }}>
                      {p.label}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.6 }}>{p.desc}</p>
                  </div>
                  <Link
                    href={p.href}
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
                    Continue →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 48, background: "#111", border: `1px solid ${border}`, padding: "28px 24px" }}>
            <p style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>
              You don&apos;t have any courses yet. Browse below to get started.
            </p>
          </div>
        )}

        {/* Upsell shelf */}
        {upsells.length > 0 && (
          <div>
            <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>
              {owned.length > 0 ? "Add to Your Account" : "Get Started"}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#555", marginBottom: 16 }}>
              {owned.length > 0 ? "10% member discount applied automatically." : "Founding member pricing. Limited time."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: owned.length > 0 ? 0 : 16 }}>
              {upsells.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: u.featured ? "#1a1208" : "#111",
                    border: u.featured ? `1px solid rgba(201,169,110,0.3)` : `1px solid ${border}`,
                    borderLeft: `3px solid ${gold}`,
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {u.featured && (
                      <span style={{ display: "inline-block", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0a0a0a", background: gold, padding: "2px 8px", marginBottom: 8 }}>
                        Best Value
                      </span>
                    )}
                    <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 4 }}>
                      {u.label}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.6 }}>{u.desc}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      {u.regularPrice !== u.price && (
                        <span style={{ display: "block", fontSize: "0.7rem", color: "#444", textDecoration: "line-through" }}>{u.regularPrice}</span>
                      )}
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "1.3rem", fontWeight: 700, color: gold }}>{u.price}</span>
                    </div>
                    <Link
                      href={u.href}
                      style={{
                        display: "inline-block",
                        background: u.featured ? gold : "transparent",
                        color: u.featured ? "#0a0a0a" : gold,
                        border: u.featured ? "none" : `1px solid rgba(201,169,110,0.5)`,
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
                      Get Access
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
