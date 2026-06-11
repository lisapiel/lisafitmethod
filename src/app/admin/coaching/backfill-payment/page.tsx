"use client"

import { useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

export default function BackfillPaymentPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function submit() {
    if (!email.trim()) return
    setSubmitting(true)
    setResult(null)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) {
        setResult({ ok: false, message: "Not authenticated" })
        setSubmitting(false)
        return
      }
      const res = await fetch("/api/admin/coaching/backfill-payment", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, message: data.message ?? "Provisioned successfully" })
      } else {
        setResult({ ok: false, message: data.error ?? "Failed to backfill" })
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Network error" })
    }
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link href="/admin/coaching" style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1.5rem" }}>
          ← Coaching
        </Link>

        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, margin: "0 0 6px" }}>Recover Payment</p>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 700, color: cream, margin: 0 }}>
            Backfill from Stripe
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: muted, margin: "0.75rem 0 0", lineHeight: 1.6 }}>
            Use this if someone paid for coaching but didn&apos;t get provisioned (the webhook missed it). Enter their email, and the system will look up their active coaching subscription in Stripe and grant them access.
          </p>
        </div>

        <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.75rem" }}>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: gold, display: "block", marginBottom: 8 }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@example.com"
            style={{
              width: "100%", background: "#111", border: `1px solid ${border}`, borderRadius: 6,
              color: cream, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem",
              padding: "0.75rem 1rem", outline: "none", boxSizing: "border-box", marginBottom: "1.25rem",
            }}
          />

          <button
            onClick={submit}
            disabled={submitting || !email.trim()}
            style={{
              background: email.trim() ? gold : "#2a2a2a", border: "none",
              color: email.trim() ? "#111" : muted, padding: "12px 28px",
              fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 700,
              letterSpacing: "0.05em", cursor: email.trim() ? "pointer" : "not-allowed",
              borderRadius: 4, transition: "background 0.15s",
            }}
          >
            {submitting ? "Checking Stripe..." : "Backfill from Stripe"}
          </button>

          {result && (
            <div style={{
              marginTop: "1.25rem",
              padding: "1rem 1.25rem",
              background: result.ok ? "#1a2d1f" : "#2d1a1a",
              border: `1px solid ${result.ok ? "#5c9e6a" : "#d97460"}`,
              borderRadius: 6,
            }}>
              <p style={{
                fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: result.ok ? "#5c9e6a" : "#d97460",
                margin: "0 0 6px",
              }}>
                {result.ok ? "Success" : "Error"}
              </p>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, lineHeight: 1.5, margin: 0 }}>
                {result.message}
              </p>
              {result.ok && (
                <Link
                  href="/admin/coaching/clients"
                  style={{
                    display: "inline-block",
                    marginTop: "0.75rem",
                    fontFamily: "var(--font-montserrat), sans-serif",
                    fontSize: "0.7rem",
                    color: gold,
                    textDecoration: "none",
                    letterSpacing: "0.05em",
                  }}
                >
                  View clients →
                </Link>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "#0d0d0d", border: `1px solid ${border}`, borderRadius: 8 }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: cream }}>How it works:</strong> The system searches Stripe for an active coaching subscription matching this email. If found, it grants coaching access, creates a client record (if missing), updates any matching application to PAID, and sends a welcome email. This is safe to run multiple times — it&apos;s idempotent.
          </p>
        </div>
      </div>
    </div>
  )
}
