"use client"

import { useState, useEffect, use } from "react"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

export default function AdminClientNotesPage({ params }: { params: Promise<{ email: string }> }) {
  const { email: encodedEmail } = use(params)
  const clientEmail = decodeURIComponent(encodedEmail)

  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState("")
  const [clientName, setClientName] = useState("")
  const [notes, setNotes] = useState("")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const db = generateClient<Schema>({ authMode: "userPool" })
        const { data: clients } = await db.models.CoachingClient.list({ authMode: "userPool" })
        const match = clients.find((c) => c.email.toLowerCase() === clientEmail.toLowerCase())
        if (match) {
          setClientId(match.id)
          setClientName(match.displayName)
          setNotes(match.privateNotes ?? "")
        }
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [clientEmail])

  async function save() {
    if (!clientId) return
    setSaving(true)
    try {
      const db = generateClient<Schema>({ authMode: "userPool" })
      await db.models.CoachingClient.update({ id: clientId, privateNotes: notes })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href={`/admin/coaching/clients/${encodedEmail}`} style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1.5rem" }}>
          ← {clientName || clientEmail}
        </Link>

        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, margin: "0 0 6px" }}>Private</p>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 700, color: cream, margin: 0 }}>Coach Notes</h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, marginTop: 6 }}>
            Never visible to the client
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <div style={{ width: 20, height: 20, border: `2px solid ${border}`, borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        ) : (
          <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem" }}>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
              placeholder={`Private notes about ${clientName || clientEmail}. Goals context, personality notes, things to remember for check-in responses, program adjustments…`}
              rows={18}
              style={{
                width: "100%",
                background: "#111",
                border: `1px solid ${border}`,
                borderRadius: 6,
                padding: "1rem",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.875rem",
                color: cream,
                lineHeight: 1.7,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
              <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: saved ? "#5c9e6a" : "transparent" }}>
                ✓ Saved
              </span>
              <button
                onClick={save}
                disabled={saving}
                style={{ background: gold, border: "none", color: "#111", padding: "10px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", borderRadius: 4 }}
              >
                {saving ? "Saving…" : "Save Notes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
