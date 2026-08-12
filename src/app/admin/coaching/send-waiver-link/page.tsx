"use client"

import { useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

export default function SendWaiverLinkPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setResult({ ok: false, message: "Not authenticated." }); setLoading(false); return }
      const res = await fetch("/api/admin/coaching/send-waiver-link", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; message?: string }
      if (res.ok && data.ok) {
        setResult({ ok: true, message: data.message ?? `Waiver link sent to ${email}.` })
        setEmail("")
      } else {
        setResult({ ok: false, message: data.error ?? "Something went wrong." })
      }
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." })
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#111", color: cream, fontFamily: "var(--font-dm-sans), sans-serif", padding: "3rem 2rem" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 12 }}>
          Admin — Coaching
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: cream, marginBottom: 8, lineHeight: 1.2 }}>
          Send Waiver Acceptance Link
        </h1>
        <p style={{ fontSize: 14, color: muted, lineHeight: 1.7, marginBottom: 32 }}>
          Use this for coaching clients who paid but bypassed the acceptance interstitial (e.g. via the backfill tool).
          The link expires in 48 hours. The client must personally check both boxes — no admin override.
        </p>

        <div style={{ background: "#1a1a1a", border: `1px solid ${border}`, borderRadius: 4, padding: "28px 28px 24px", marginBottom: 32 }}>
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: muted }}>
              Client Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              required
              style={{
                width: "100%",
                background: "#0f0f0f",
                border: `1px solid ${border}`,
                color: cream,
                fontSize: 14,
                padding: "12px 14px",
                borderRadius: 2,
                outline: "none",
                marginBottom: 20,
                boxSizing: "border-box",
                fontFamily: "var(--font-dm-sans), sans-serif",
              }}
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                background: loading || !email.trim() ? "#2a2520" : gold,
                color: loading || !email.trim() ? "#6a5a3f" : "#0a0a0a",
                border: "none",
                padding: "14px 28px",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                fontFamily: "var(--font-dm-sans), sans-serif",
              }}
            >
              {loading ? "Sending…" : "Send Waiver Link"}
            </button>
          </form>
        </div>

        {result && (
          <div style={{
            padding: "16px 20px",
            borderRadius: 4,
            border: `1px solid ${result.ok ? "#2d4a2d" : "#4a2020"}`,
            background: result.ok ? "#1a2d1a" : "#2d1a1a",
            color: result.ok ? "#7dba7d" : "#d97a7a",
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 24,
          }}>
            {result.message}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${border}`, paddingTop: 20 }}>
          <p style={{ fontSize: 13, color: muted, marginBottom: 12 }}>What happens after you send:</p>
          <ol style={{ fontSize: 13, color: muted, lineHeight: 1.8, paddingLeft: "1.25rem", margin: 0 }}>
            <li>The client receives an email with a one-time link (expires 48 hours).</li>
            <li>They visit the link and personally check both acceptance checkboxes.</li>
            <li>Acceptance is recorded and their coaching portal is provisioned/unlocked.</li>
            <li>They receive the appropriate setup or welcome email automatically.</li>
          </ol>
        </div>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${border}` }}>
          <Link href="/admin/coaching/applications" style={{ fontSize: 13, color: gold, textDecoration: "none" }}>
            ← Back to Applications
          </Link>
        </div>
      </div>
    </div>
  )
}
