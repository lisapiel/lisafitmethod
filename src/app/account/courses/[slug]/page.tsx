import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

const gold = "#c9a96e"

interface ProductInfo {
  name: string
  tagline: string
  fullPrice: string
  memberPrice: string
  saving: string | null
  includes: string[]
  checkoutHref: string
  backHref: string
  backLabel: string
}

const PRODUCTS: Record<string, ProductInfo> = {
  training: {
    name: "Training Foundations",
    tagline: "4-Week Beginner Strength Program",
    fullPrice: "$97",
    memberPrice: "$87",
    saving: "Save $10",
    includes: [
      "5 foundational movement patterns — hip hinge, squat, push, pull, brace & carry",
      "4-week progressive training program — 3 days per week",
      "Day A / B / C structure with warm-up, main workout, and cool-down",
      "Built-in workout tracker to log every session inside the course",
      "Nutrition module: protein, fueling, hydration, and consistency principles",
      "Lifetime access — revisit the program any time",
    ],
    checkoutHref: "/checkout?member=1",
    backHref: "/nutrition-foundations",
    backLabel: "Back to Nutrition",
  },
  nutrition: {
    name: "Nutrition Foundations",
    tagline: "4-Week Nutrition Course",
    fullPrice: "$77",
    memberPrice: "$69",
    saving: "Save $8",
    includes: [
      "TDEE calculator — personalized to your stats and activity level",
      "4-week flexible meal plan framework",
      "Real, verified recipes that actually match the macros",
      "Module on understanding your body's energy needs and hormones",
      "Macro tracking strategy without obsessing over every number",
      "Lifetime access — revisit any module any time",
    ],
    checkoutHref: "/checkout?product=nutrition&member=1",
    backHref: "/training-foundations",
    backLabel: "Back to Training",
  },
  tracker: {
    name: "Progress Tracker",
    tagline: "Lifetime Workout Tracking",
    fullPrice: "$27",
    memberPrice: "$27",
    saving: null,
    includes: [
      "Build completely custom workout days — any program, not just Foundations",
      "Log every set, rep, and weight lifted",
      "Always know the number to beat next session",
      "Track progress week over week with full history",
      "Designed to grow with you long after the 4-week course ends",
      "One-time payment — lifetime access, never a subscription",
    ],
    checkoutHref: "/checkout?member=1#tracker",
    backHref: "/training-foundations",
    backLabel: "Back to Training",
  },
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = PRODUCTS[params.slug]
  if (!product) return { title: "Not Found" }
  return { title: `${product.name} — Lisa Fit Method` }
}

export default function CoursesUpgradePage({ params }: { params: { slug: string } }) {
  const product = PRODUCTS[params.slug]
  if (!product) notFound()

  const isTracker = params.slug === "tracker"

  return (
    <main style={{
      background: "#0a0a0a",
      minHeight: "100vh",
      fontFamily: "var(--font-montserrat), sans-serif",
      color: "#f0e6d3",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1e1e1e",
        padding: "0 32px",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", fontWeight: 600, color: "#f0e6d3", letterSpacing: "0.04em" }}>
            Lisa <span style={{ color: gold }}>Fit Method</span>
          </span>
        </Link>
        <Link
          href="/account"
          style={{ fontSize: "0.55rem", color: "#444", textDecoration: "none", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}
        >
          My Account
        </Link>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Back link */}
        <Link
          href={product.backHref}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.55rem", color: "#444", textDecoration: "none", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 36, fontWeight: 600 }}
        >
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {product.backLabel}
        </Link>

        {/* Product header */}
        <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 10 }}>
          {isTracker ? "Add-On" : "Course"}
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 5vw, 2.6rem)", fontWeight: 300, color: "#f0e6d3", lineHeight: 1.15, marginBottom: 8 }}>
          {product.name}
        </h1>
        <p style={{ fontSize: "0.75rem", color: "#666", marginBottom: 36, letterSpacing: "0.04em" }}>
          {product.tagline}
        </p>

        {/* What's included */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>
            What&apos;s Included
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {product.includes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M2 6l3 3 5-5" stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.65 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing + CTA */}
        <div style={{
          background: "#111",
          border: "1px solid #1e1e1e",
          borderTop: `2px solid ${gold}`,
          padding: "24px 28px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#444", marginBottom: 6 }}>
                Member Price
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.2rem", fontWeight: 300, color: gold }}>
                  {product.memberPrice}
                </span>
                {product.saving && (
                  <span style={{ fontSize: "0.6rem", color: gold, fontWeight: 600, opacity: 0.7 }}>
                    {product.saving}
                  </span>
                )}
              </div>
              {product.fullPrice !== product.memberPrice && (
                <p style={{ fontSize: "0.6rem", color: "#333", textDecoration: "line-through", marginTop: 2 }}>
                  Regular {product.fullPrice}
                </p>
              )}
            </div>
            <Link
              href={product.checkoutHref}
              style={{
                display: "inline-block",
                background: gold,
                color: "#0a0a0a",
                textDecoration: "none",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.8rem 1.75rem",
                whiteSpace: "nowrap",
              }}
            >
              Get Access →
            </Link>
          </div>
          <p style={{ fontSize: "0.6rem", color: "#333", marginTop: 14, lineHeight: 1.6 }}>
            Member discount applied automatically. One-time payment. Lifetime access.
          </p>
        </div>

      </div>
    </main>
  )
}
