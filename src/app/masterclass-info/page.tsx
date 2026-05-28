import Link from "next/link"
import type { Metadata } from "next"
import {
  MASTERCLASS_MONTHLY_DISPLAY,
  MASTERCLASS_6MONTH_DISPLAY,
  MASTERCLASS_ANNUAL_DISPLAY,
  MASTERCLASS_6MONTH_PER_MONTH_DISPLAY,
  MASTERCLASS_ANNUAL_PER_MONTH_DISPLAY,
} from "@/lib/pricing"

export const metadata: Metadata = {
  title: "Masterclass — Lisa Fit Method",
  description:
    "Monthly programming, 361 exercise videos, and Q&A with Lisa. New block every month. Cancel anytime.",
  openGraph: {
    title: "Masterclass — Lisa Fit Method",
    description: "Monthly programming, 361 exercise videos, Q&A with Lisa. From $16/month.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

const PLANS = [
  {
    id: "annual",
    label: "Annual",
    price: MASTERCLASS_ANNUAL_DISPLAY,
    perMonth: MASTERCLASS_ANNUAL_PER_MONTH_DISPLAY + "/mo",
    billing: "billed once a year",
    badge: "Most Popular",
    highlight: true,
  },
  {
    id: "6month",
    label: "6 Months",
    price: MASTERCLASS_6MONTH_DISPLAY,
    perMonth: MASTERCLASS_6MONTH_PER_MONTH_DISPLAY + "/mo",
    billing: "billed every 6 months",
    highlight: false,
  },
  {
    id: "monthly",
    label: "Monthly",
    price: MASTERCLASS_MONTHLY_DISPLAY + "/mo",
    perMonth: null,
    billing: "billed monthly, cancel anytime",
    highlight: false,
  },
]

const WHAT_YOU_GET = [
  {
    heading: "New block every month",
    body: "A fresh 3-day workout program lands on the 1st of each month. Built around progressive overload — you actually get stronger, not just tired.",
  },
  {
    heading: "361 exercise videos",
    body: "Every exercise in every program has a short, focused demo video. No guessing, no YouTube rabbit holes. Just the movement, shown clearly.",
  },
  {
    heading: "12 weeks of blocks always accessible",
    body: "Current month plus the two previous blocks. Repeat a block, skip ahead, or go back to something that worked. Your choice.",
  },
  {
    heading: "Monthly Q&A with Lisa",
    body: "Submit your questions anytime. Lisa answers in batch once a month. Best answers are published so every member benefits.",
  },
  {
    heading: "Built-in progress tracking",
    body: "Mark workouts complete. Track streaks. See your history at a glance. Simple, no fuss.",
  },
]

const FAQ = [
  {
    q: "Do I need equipment?",
    a: "Most programs use dumbbells, a resistance band, and a bench. Some exercises are bodyweight-only. You filter exercises by equipment when you build — or Lisa builds with your setup in mind from the start.",
  },
  {
    q: "What if I'm a beginner?",
    a: "The Masterclass assumes you know the basics. If you're starting from zero, complete Training Foundations first — it teaches the movement patterns used throughout Masterclass programming.",
  },
  {
    q: "What happens when I cancel?",
    a: "You keep access until the end of your paid period. No tricks, no questions asked.",
  },
  {
    q: "Can I pause instead of cancel?",
    a: "Not at the moment — it's cancel and re-subscribe when you're ready. We may add pausing later.",
  },
  {
    q: "Will the programming get repetitive?",
    a: "No. The 361-video library gives Lisa enormous range. Each block is built fresh — different exercise selections, different loading schemes, different focuses. Members who've followed for 6+ months say it never feels like the same workout twice.",
  },
]

const gold = "#c9a96e"
const border = "#2a2a2a"

export default function MasterclassInfoPage() {
  return (
    <main style={{ background: "#0a0a0a", color: "#f0e6d3", minHeight: "100vh", fontFamily: "var(--font-montserrat), sans-serif" }}>

      {/* Nav */}
      <header style={{ borderBottom: `1px solid ${border}`, padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", fontWeight: 600, color: "#f0e6d3" }}>
            Lisa <span style={{ color: gold }}>Fit Method</span>
          </span>
        </Link>
        <Link href="/masterclass/subscribe" style={{
          background: gold,
          color: "#0a0a0a",
          padding: "10px 20px",
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}>
          Join Now
        </Link>
      </header>

      {/* Hero */}
      <section style={{ padding: "6rem 2rem 5rem", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "1.25rem" }}>
          Lisa Fit Method Masterclass
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(36px, 8vw, 68px)", fontWeight: 300, color: "#f0e6d3", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          Programming that<br />never gets old.
        </h1>
        <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "#888", lineHeight: 1.8, maxWidth: 520, margin: "0 auto 2.5rem" }}>
          A new 3-day workout block every month. 361 exercise videos. Monthly Q&A with Lisa. All in one place, built to keep you progressing.
        </p>
        <Link href="/masterclass/subscribe" style={{
          display: "inline-block",
          background: gold,
          color: "#0a0a0a",
          padding: "16px 36px",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}>
          Start from {MASTERCLASS_ANNUAL_PER_MONTH_DISPLAY}/mo
        </Link>
        <p style={{ fontSize: 11, color: "#444", marginTop: 16 }}>Cancel anytime. No contracts.</p>
      </section>

      {/* What you get */}
      <section style={{ padding: "4rem 2rem", maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#555", textAlign: "center", marginBottom: "3rem" }}>
          What&apos;s Included
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
          {WHAT_YOU_GET.map(({ heading, body }) => (
            <div key={heading} style={{ background: "#111", border: `1px solid ${border}`, borderRadius: 2, padding: "24px 20px" }}>
              <p style={{ margin: "0 0 10px", fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 400, color: "#f0e6d3", lineHeight: 1.3 }}>
                {heading}
              </p>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "#888", lineHeight: 1.7 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "5rem 2rem", maxWidth: 600, margin: "0 auto" }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#555", textAlign: "center", marginBottom: "3rem" }}>
          Pricing
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {PLANS.map((plan) => (
            <div key={plan.id} style={{
              background: plan.highlight ? "#161616" : "#0e0e0e",
              border: `1px solid ${plan.highlight ? gold : border}`,
              borderRadius: 2,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
            }}>
              {plan.badge && (
                <span style={{ position: "absolute", top: -10, right: 16, background: gold, color: "#0a0a0a", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "3px 10px" }}>
                  {plan.badge}
                </span>
              )}
              <div>
                <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: plan.highlight ? gold : "#888" }}>
                  {plan.label}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "0.6rem", color: "#555" }}>{plan.billing}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#f0e6d3" }}>{plan.price}</p>
                {plan.perMonth && <p style={{ margin: "2px 0 0", fontSize: "0.6rem", color: "#666" }}>{plan.perMonth}</p>}
              </div>
            </div>
          ))}
        </div>
        <Link href="/masterclass/subscribe" style={{
          display: "block",
          background: gold,
          color: "#0a0a0a",
          padding: "16px",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          textDecoration: "none",
          textAlign: "center",
        }}>
          Get Started
        </Link>
        <p style={{ fontSize: 11, color: "#444", textAlign: "center", marginTop: 16 }}>Cancel anytime. No contracts.</p>
      </section>

      {/* FAQ */}
      <section style={{ padding: "4rem 2rem 6rem", maxWidth: 680, margin: "0 auto" }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#555", textAlign: "center", marginBottom: "3rem" }}>
          Questions
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {FAQ.map(({ q, a }) => (
            <div key={q} style={{ borderBottom: `1px solid ${border}`, padding: "1.5rem 0" }}>
              <p style={{ margin: "0 0 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 600, color: "#f0e6d3" }}>
                {q}
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#888", lineHeight: 1.7 }}>
                {a}
              </p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.7rem", color: "#555", marginBottom: "1.25rem" }}>Ready to start?</p>
          <Link href="/masterclass/subscribe" style={{
            display: "inline-block",
            background: gold,
            color: "#0a0a0a",
            padding: "14px 32px",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}>
            Join the Masterclass
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#333" }}>
          © {new Date().getFullYear()} Lisa Fit Method · <Link href="/" style={{ color: "#555", textDecoration: "none" }}>lisafitmethod.com</Link>
        </p>
      </footer>
    </main>
  )
}
