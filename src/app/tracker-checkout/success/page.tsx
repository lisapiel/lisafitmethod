import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Tracker Unlocked | Lisa Fit Method",
}

export default function TrackerSuccessPage() {
  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh", color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 16 }}>
          My Workout Tracker
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 400, color: "#f0e6d3", lineHeight: 1.2, marginBottom: 20 }}>
          Your tracker is ready.
        </h1>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8, marginBottom: 12 }}>
          It&apos;s yours to keep.
        </p>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 36 }}>
          Log in to your Lisa Fit Method account and open the tracker to start building your program. A confirmation has been sent to your email.
        </p>

        <Link
          href="/my-tracker"
          style={{
            display: "inline-block",
            background: "#c9a96e",
            color: "#0a0a0a",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textDecoration: "none",
            padding: "18px 36px",
            marginBottom: 20,
          }}
        >
          Open My Tracker →
        </Link>

        <p style={{ fontSize: 11, color: "#333", marginTop: 12 }}>
          <Link href="/login" style={{ color: "#c9a96e", textDecoration: "none" }}>Log in</Link>
          {" "}if you&apos;re not signed in yet.
        </p>
      </div>
    </main>
  )
}
