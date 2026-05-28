import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Welcome — Lisa Fit Method",
  description: "Your purchase is complete. Check your email for access.",
}

interface UpsellProduct {
  label: string
  headline: string
  desc: string
  price: string
  regularPrice: string
  href: string
  isBundle?: boolean
}

function getUpsells(product: string): UpsellProduct[] {
  if (product === "training") {
    return [
      {
        label: "Masterclass — Monthly Programming",
        headline: "Keep training after 4 weeks",
        desc: "New 3-day workout block every month. 361 exercise videos. Monthly Q&A with Lisa. Built-in progress tracking. From $16.42/mo.",
        price: "From $197/yr",
        regularPrice: "",
        href: "/masterclass-info",
        isBundle: false,
      },
      {
        label: "Nutrition Foundations",
        headline: "Pair it with the right nutrition",
        desc: "4-week nutrition course with personalized TDEE calculator, meal plan, and real verified recipes.",
        price: "$77",
        regularPrice: "$127",
        href: "/checkout?product=nutrition&member=1",
      },
    ]
  }
  if (product === "nutrition") {
    return [
      {
        label: "Training Foundations",
        headline: "Put the nutrition to work",
        desc: "4-week beginner strength program. Five foundational movements, progressive overload, built-in workout tracking.",
        price: "$97",
        regularPrice: "$147",
        href: "/checkout?member=1",
      },
    ]
  }
  if (product === "bundle") {
    return [
      {
        label: "Progress Tracker",
        headline: "Keep going after 4 weeks",
        desc: "Build your own workout days, log every lift, and always know the number you're trying to beat. Lifetime access.",
        price: "$27",
        regularPrice: "$27",
        href: "/checkout?member=1#tracker",
      },
    ]
  }
  return []
}

export default async function PurchaseSuccessPage({ searchParams }: { searchParams: Promise<{ product?: string; email?: string }> }) {
  const { product = "training" } = await searchParams
  const upsells = getUpsells(product)

  const gold = "#c9a96e"

  return (
    <main style={{
      background: "#0a0a0a",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      fontFamily: "var(--font-montserrat), sans-serif",
      textAlign: "center",
    }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 56 }}>
        <span style={{
          fontFamily: "var(--font-cormorant), serif",
          fontSize: 24,
          fontWeight: 600,
          color: "#f0e6d3",
        }}>
          Lisa <span style={{ color: gold }}>Fit Method</span>
        </span>
      </Link>

      {/* Gold checkmark */}
      <div style={{
        width: 64,
        height: 64,
        border: "1px solid rgba(201,169,110,0.4)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
      }}>
        <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
          <path d="M2 10L10 18L26 2" stroke={gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: gold,
        marginBottom: 12,
      }}>
        Purchase Complete
      </p>

      <h1 style={{
        fontFamily: "var(--font-cormorant), serif",
        fontSize: "clamp(32px, 5vw, 52px)",
        fontWeight: 400,
        color: "#f0e6d3",
        lineHeight: 1.2,
        marginBottom: 20,
        maxWidth: 520,
      }}>
        You&apos;re in.<br />
        <em style={{ color: gold }}>Let&apos;s build something that lasts.</em>
      </h1>

      <div style={{
        maxWidth: 440,
        background: "#111",
        border: "1px solid #1a1a1a",
        padding: "32px 36px",
        textAlign: "left",
        marginBottom: 40,
      }}>
        <p style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#555",
          marginBottom: 16,
        }}>
          What happens next
        </p>
        <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { num: "1", text: "Check your email — you'll receive your login credentials within a few minutes." },
            { num: "2", text: "Go to the login page and sign in with your email and the temporary password from the email." },
            { num: "3", text: "You'll be prompted to set a permanent password, then you're in the course." },
          ].map((step) => (
            <li key={step.num} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: 28,
                fontWeight: 300,
                color: "rgba(201,169,110,0.3)",
                lineHeight: 1,
                flexShrink: 0,
              }}>
                {step.num}
              </span>
              <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, paddingTop: 4 }}>
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <Link
        href="/login"
        style={{
          display: "inline-block",
          background: gold,
          color: "#0a0a0a",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          textDecoration: "none",
          padding: "16px 40px",
          marginBottom: 24,
        }}
      >
        Go to Login →
      </Link>

      <p style={{ fontSize: 12, color: "#444", lineHeight: 1.8, marginBottom: upsells.length > 0 ? 56 : 0 }}>
        Didn&apos;t get an email? Check your spam folder.<br />
        Still nothing? Email <a href="mailto:lisa@lisafitmethod.com" style={{ color: gold, textDecoration: "none" }}>lisa@lisafitmethod.com</a>
      </p>

      {upsells.length > 0 && (
        <div style={{ width: "100%", maxWidth: 560 }}>
          <p style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: 20,
          }}>
            Complete your program
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {upsells.map((u) => (
              <div
                key={u.label}
                style={{
                  background: "#111",
                  border: u.isBundle ? `1px solid rgba(201,169,110,0.35)` : "1px solid #1a1a1a",
                  borderLeft: `3px solid ${gold}`,
                  padding: "20px 24px",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 4 }}>
                    {u.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 18, fontWeight: 300, color: "#f0e6d3", marginBottom: 4 }}>
                    {u.headline}
                  </p>
                  <p style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>{u.desc}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    {u.regularPrice !== u.price && (
                      <span style={{ display: "block", fontSize: 11, color: "#444", textDecoration: "line-through" }}>{u.regularPrice}</span>
                    )}
                    <span style={{ fontSize: 22, fontWeight: 700, color: gold }}>{u.price}</span>
                  </div>
                  <Link
                    href={u.href}
                    style={{
                      display: "inline-block",
                      background: u.isBundle ? gold : "transparent",
                      color: u.isBundle ? "#0a0a0a" : gold,
                      border: u.isBundle ? "none" : `1px solid rgba(201,169,110,0.5)`,
                      fontFamily: "var(--font-montserrat), sans-serif",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      padding: "10px 18px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Add Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
