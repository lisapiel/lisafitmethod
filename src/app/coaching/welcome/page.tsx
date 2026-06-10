import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Welcome — Lisa Fit Method",
  robots: "noindex, nofollow",
}

export default function CoachingWelcomePage() {
  return (
    <main style={{
      background: "#0a0a0a",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-dm-sans), sans-serif",
      padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 24 }}>
          1:1 Coaching
        </p>
        <h1 style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "clamp(36px, 5vw, 52px)",
          fontWeight: 700,
          color: "#f5f2ee",
          lineHeight: 1.1,
          marginBottom: 24,
        }}>
          You&apos;re in.
        </h1>
        <p style={{ fontSize: 16, color: "rgba(245,242,238,0.65)", lineHeight: 1.7, marginBottom: 16 }}>
          Payment confirmed. You&apos;ll receive an email shortly with your login details.
        </p>
        <p style={{ fontSize: 15, color: "rgba(245,242,238,0.5)", lineHeight: 1.7, marginBottom: 40 }}>
          Once your account is set up, you&apos;ll have access to your coaching portal where you&apos;ll find your program, progress tracking, check-ins, and direct messaging with Lisa.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/account"
            style={{
              display: "inline-block",
              background: "#c8a97e",
              color: "#0a0a0a",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textDecoration: "none",
              padding: "16px 32px",
            }}
          >
            Go to My Account
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "transparent",
              color: "rgba(245,242,238,0.4)",
              fontSize: 13,
              textDecoration: "none",
              padding: "16px 24px",
            }}
          >
            Back to site
          </Link>
        </div>
      </div>
    </main>
  )
}
