import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found | Lisa Fit Method",
}

export default function NotFound() {
  return (
    <main style={{ background: "#0a0a0a", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 28px" }}>
      <div>
        <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 80, fontWeight: 900, color: "rgba(200,169,126,0.2)", lineHeight: 1, marginBottom: 0 }}>404</p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, color: "#f5f2ee", lineHeight: 1.15, marginBottom: 16, marginTop: -16 }}>
          Page not found.
        </h1>
        <p style={{ fontSize: 16, color: "rgba(245,242,238,0.45)", marginBottom: 40, maxWidth: 380, margin: "0 auto 40px", lineHeight: 1.7 }}>
          This page doesn&apos;t exist or was moved. Let&apos;s get you back on track.
        </p>
        <Link href="/" style={{ display: "inline-block", background: "#c8a97e", color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", padding: "16px 40px" }}>
          Back to Home
        </Link>
      </div>
    </main>
  )
}
