"use client"
import { useEffect, useState } from "react"
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth"
import { TrackerProvider } from "@/components/tracker/TrackerContext"
import { TrackerApp } from "@/components/tracker/TrackerApp"
import Link from "next/link"

type State = "loading" | "has_access" | "no_access" | "error"

export function TrackerPageClient() {
  const [state, setState] = useState<State>("loading")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      try {
        const user = await getCurrentUser()
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (!token) { setState("error"); return }

        const res = await fetch("/api/tracker/access", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) { setState("error"); return }

        const data = await res.json() as { hasAccess: boolean }
        setUserId(user.userId)
        setState(data.hasAccess ? "has_access" : "no_access")
      } catch {
        setState("error")
      }
    }
    check()
  }, [])

  if (state === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #2a2a2a", borderTop: "2px solid #c9a96e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Something went wrong. Please try again.</p>
        <button onClick={() => window.location.reload()} style={{ background: "none", border: "1px solid #2a2a2a", color: "#c9a96e", fontSize: 12, padding: "10px 24px", cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em" }}>
          Retry
        </button>
      </div>
    )
  }

  if (state === "no_access") {
    return <TrackerUpsell />
  }

  return (
    <TrackerProvider userId={userId!}>
      <TrackerApp />
    </TrackerProvider>
  )
}

function TrackerUpsell() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 24px", borderBottom: "1px solid #1a1a1a" }}>
        <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 20, fontWeight: 600, color: "#f0e6d3", letterSpacing: "0.05em" }}>
          Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 16 }}>
          My Workout Tracker
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 400, color: "#f0e6d3", lineHeight: 1.2, marginBottom: 20, textAlign: "center" }}>
          Build your program.<br /><em>Use it forever.</em>
        </h1>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.8, marginBottom: 32, textAlign: "center" }}>
          Create your own workout days, add any exercise, and log every set — week after week. See your previous numbers so you always know what to beat. Yours to keep, even after the program ends.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36, width: "100%", maxWidth: 360 }}>
          {[
            "Name your own workout days — Push Day, Leg Day, whatever fits you",
            "Track weight + reps, reps only, or duration per exercise",
            "Progressive overload built in — see last week inline",
            "Unlimited weeks. Works like an app on your phone.",
          ].map((f) => (
            <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: "#c9a96e", fontSize: 11, marginTop: 3, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 28 }}>
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 40, fontWeight: 700, color: "#c9a96e", lineHeight: 1 }}>$17</span>
          <span style={{ fontSize: 12, color: "#666", letterSpacing: "0.08em" }}>one-time · lifetime access</span>
        </div>

        <Link
          href="/tracker-checkout"
          style={{
            display: "block",
            width: "100%",
            maxWidth: 360,
            background: "#c9a96e",
            color: "#0a0a0a",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textDecoration: "none",
            textAlign: "center",
            padding: "18px 32px",
            boxSizing: "border-box" as const,
          }}
        >
          Get the Tracker →
        </Link>

        <p style={{ marginTop: 16, fontSize: 11, color: "#444", textAlign: "center" }}>
          Already purchased?{" "}
          <button
            onClick={() => window.location.reload()}
            style={{ background: "none", border: "none", color: "#c9a96e", fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "var(--font-montserrat), sans-serif" }}
          >
            Refresh
          </button>
        </p>
      </div>

      {/* Promo footer */}
      <div style={{ borderTop: "1px solid #1a1a1a", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" as const }}>
        <a href="https://lisafitmethod.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>lisafitmethod.com</a>
        <span style={{ color: "#2a2a2a", fontSize: 10 }}>·</span>
        <Link href="/courses" style={{ fontSize: 10, color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Courses</Link>
        <span style={{ color: "#2a2a2a", fontSize: 10 }}>·</span>
        <Link href="/coaching" style={{ fontSize: 10, color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>1:1 Coaching</Link>
      </div>
    </div>
  )
}
