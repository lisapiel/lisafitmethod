"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

export default function AdminCoachingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [priceInput, setPriceInput] = useState("")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch("/api/admin/coaching/settings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json() as { priceInCents: number }
      if (data.priceInCents) {
        setPriceInput(String(data.priceInCents / 100))
      }
    } catch { /* handled by layout */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const cents = Math.round(parseFloat(priceInput) * 100)
      if (isNaN(cents) || cents < 100) {
        setError("Price must be at least $1.00")
        setSaving(false)
        return
      }
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch("/api/admin/coaching/settings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ priceInCents: cents }),
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (!data.ok) {
        setError(data.error ?? "Something went wrong")
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch {
      setError("Something went wrong")
    }
    setSaving(false)
  }

  const displayPrice = !isNaN(parseFloat(priceInput)) && priceInput
    ? `$${parseFloat(priceInput).toFixed(2)}/month`
    : null

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/admin/coaching/applications" style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
            ← Applications
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.2rem", fontWeight: 700, color: cream, margin: 0 }}>
            Coaching Settings
          </h1>
        </div>

        {loading ? (
          <p style={{ color: muted, fontSize: "0.8rem" }}>Loading…</p>
        ) : (
          <form onSubmit={save}>
            <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "2rem" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: gold, margin: "0 0 6px" }}>
                Monthly Price (USD)
              </p>
              <p style={{ fontSize: "0.75rem", color: muted, margin: "0 0 16px", lineHeight: 1.5 }}>
                Set the monthly recurring price for 1:1 coaching. This is used when sending Stripe payment links to approved applicants.
              </p>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ background: "#1e1e1e", border: `1px solid ${border}`, borderRight: "none", padding: "10px 14px", fontSize: "0.9rem", color: muted, borderRadius: "4px 0 0 4px" }}>
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="197.00"
                  style={{
                    flex: 1,
                    background: "#1e1e1e",
                    border: `1px solid ${border}`,
                    borderLeft: "none",
                    borderRadius: "0 4px 4px 0",
                    padding: "10px 14px",
                    fontSize: "0.9rem",
                    color: cream,
                    fontFamily: "var(--font-montserrat), sans-serif",
                    outline: "none",
                  }}
                />
              </div>
              {displayPrice && (
                <p style={{ fontSize: "0.7rem", color: muted, marginTop: 8 }}>
                  Clients will be charged {displayPrice}
                </p>
              )}
            </div>

            {error && (
              <p style={{ fontSize: "0.75rem", color: "#d97460", marginTop: 12 }}>{error}</p>
            )}

            <div style={{ marginTop: "1.25rem" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: saved ? "#5c9e6a" : gold,
                  border: "none",
                  color: "#111",
                  padding: "10px 24px",
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  borderRadius: 4,
                  opacity: saving ? 0.7 : 1,
                  transition: "background 0.2s",
                }}
              >
                {saved ? "Saved ✓" : saving ? "Saving…" : "Save Price"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
