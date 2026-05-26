"use client"
import { useState } from "react"
import { useTracker } from "./TrackerContext"
import Link from "next/link"
import { signOut } from "aws-amplify/auth"

interface SettingsViewProps {
  onBack: () => void
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const { data, setWeightUnit } = useTracker()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      window.location.href = "/login"
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {/* Weight unit */}
      <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #1a1a1a" }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 14 }}>
          Weight Unit
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {(["lbs", "kg"] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => setWeightUnit(unit)}
              style={{
                flex: 1,
                background: data.weightUnit === unit ? "rgba(201,169,110,0.1)" : "#111111",
                border: data.weightUnit === unit ? "1px solid #c9a96e" : "1px solid #2a2a2a",
                color: data.weightUnit === unit ? "#c9a96e" : "#555",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.1em",
                padding: "14px",
                cursor: "pointer",
              }}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      {/* Data info */}
      <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #1a1a1a" }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>
          Your Data
        </p>
        <p style={{ fontSize: 12, color: "#444", lineHeight: 1.7 }}>
          {data.days.length} workout {data.days.length === 1 ? "day" : "days"} · {data.weeks.length} {data.weeks.length === 1 ? "week" : "weeks"} tracked
        </p>
        <p style={{ fontSize: 11, color: "#333", lineHeight: 1.7, marginTop: 6 }}>
          All data is saved on this device. It stays here as long as you don&apos;t clear your browser data.
        </p>
      </div>

      {/* Links */}
      <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #1a1a1a" }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 14 }}>
          Lisa Fit Method
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Training Foundations Course", href: "/training-foundations" },
            { label: "Courses & Programs", href: "/courses" },
            { label: "1:1 Coaching with Lisa", href: "/coaching" },
            { label: "lisafitmethod.com", href: "https://lisafitmethod.com", external: true },
          ].map((link) => (
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: "#888", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #161616" }}
              >
                {link.label} <span style={{ fontSize: 10, color: "#444" }}>↗</span>
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontSize: 13, color: "#888", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #161616" }}
              >
                {link.label} <span style={{ fontSize: 10, color: "#444" }}>›</span>
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        style={{ width: "100%", background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "13px 20px", cursor: signingOut ? "not-allowed" : "pointer", marginBottom: 10 }}
      >
        {signingOut ? "Signing out…" : "Sign Out"}
      </button>

      <button
        onClick={onBack}
        style={{ width: "100%", background: "none", border: "1px solid #1e1e1e", color: "#444", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer" }}
      >
        ← Back
      </button>
    </div>
  )
}
