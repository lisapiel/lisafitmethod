"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

const DISMISSED_KEY = "lfm_tracker_upsell_dismissed"

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#888888"

export function TrackerUpsellBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(DISMISSED_KEY)) {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      marginTop: 40,
      borderLeft: `3px solid ${gold}`,
      background: "rgba(201,169,110,0.03)",
      border: `1px solid rgba(201,169,110,0.18)`,
      borderLeftWidth: 3,
      padding: "28px 24px",
      position: "relative",
    }}>
      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "#444", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}
      >
        ×
      </button>

      {/* Label */}
      <p style={{ fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 10, fontFamily: "var(--font-montserrat), sans-serif" }}>
        My Workout Tracker
      </p>

      {/* Headline */}
      <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.35rem", fontWeight: 400, color: cream, lineHeight: 1.3, marginBottom: 12 }}>
        Like tracking your progress?<br />
        <em>This is just the beginning.</em>
      </p>

      {/* Body */}
      <p style={{ fontSize: "0.65rem", color: muted, lineHeight: 1.75, marginBottom: 16, maxWidth: 480 }}>
        The in-course tracker follows your Training Foundations program. The standalone tracker is yours — build any workout, any day, and keep using it long after the program ends.
      </p>

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 22 }}>
        {[
          "Name your own workout days — Push, Pull, Leg Day, whatever fits your training",
          "Add any exercise and pick how to track it: weight + reps, reps only, or time",
          "See last week’s numbers inline while you log — progressive overload built in",
          "Unlimited weeks. No subscription, even after the program ends.",
        ].map((f) => (
          <div key={f} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
            <span style={{ color: gold, fontSize: "0.6rem", marginTop: 2, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: "0.62rem", color: "#666", lineHeight: 1.6 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Price + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "1.4rem", fontWeight: 700, color: gold, lineHeight: 1 }}>$17</span>
          <span style={{ fontSize: "0.58rem", color: "#555", letterSpacing: "0.06em" }}>one-time · no subscription</span>
        </div>
        <Link
          href="/tracker-checkout"
          style={{
            display: "inline-block",
            background: gold,
            color: "#0a0a0a",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            textDecoration: "none",
            padding: "12px 22px",
            whiteSpace: "nowrap",
          }}
        >
          Get My Workout Tracker →
        </Link>
      </div>
    </div>
  )
}
